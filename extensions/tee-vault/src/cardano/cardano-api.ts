/**
 * Cardano API client for Koios and Blockfrost providers.
 */
import type {
  CardanoNetwork,
  CardanoApiConfig,
  CardanoUtxo,
  ProtocolParameters,
  TxSubmitResult,
} from "./types.js";

export interface CardanoApiClient {
  provider: "koios" | "blockfrost";
  network: CardanoNetwork;
  endpoint: string;
  apiKey?: string;
}

const protocolParamsCache = new Map<string, { params: ProtocolParameters; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

const KOIOS_ENDPOINTS: Record<CardanoNetwork, string> = {
  mainnet: "https://api.koios.rest/api/v1",
  preprod: "https://preprod.koios.rest/api/v1",
  preview: "https://preview.koios.rest/api/v1",
};

const BLOCKFROST_ENDPOINTS: Record<CardanoNetwork, string> = {
  mainnet: "https://cardano-mainnet.blockfrost.io/api/v0",
  preprod: "https://cardano-preprod.blockfrost.io/api/v0",
  preview: "https://cardano-preview.blockfrost.io/api/v0",
};

export function createCardanoApiClient(config: CardanoApiConfig): CardanoApiClient {
  let endpoint: string;
  if (config.endpoint) {
    endpoint = config.endpoint;
  } else if (config.provider === "koios") {
    endpoint = KOIOS_ENDPOINTS[config.network];
  } else {
    endpoint = BLOCKFROST_ENDPOINTS[config.network];
  }
  return { provider: config.provider, network: config.network, endpoint, apiKey: config.apiKey };
}

export async function fetchAddressUtxos(
  client: CardanoApiClient,
  address: string,
): Promise<CardanoUtxo[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (client.provider === "blockfrost" && client.apiKey) {
    headers["project_id"] = client.apiKey;
  }

  let url: string;
  let options: RequestInit;

  if (client.provider === "koios") {
    url = client.endpoint + "/address_utxos";
    options = { method: "POST", headers, body: JSON.stringify({ _addresses: [address] }) };
  } else {
    url = client.endpoint + "/addresses/" + address + "/utxos";
    options = { method: "GET", headers };
  }

  const response = await fetch(url, options);
  if (!response.ok) throw new Error("API error: " + response.status + " " + response.statusText);

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data.map((utxo: any) => ({
    txHash: utxo.tx_hash,
    outputIndex: utxo.tx_index ?? utxo.output_index ?? 0,
    address,
    lovelace: utxo.value ?? utxo.amount?.[0]?.quantity ?? "0",
    assets: (utxo.asset_list ?? utxo.amount?.slice(1) ?? []).map((a: any) => ({
      policyId: a.policy_id ?? a.unit?.slice(0, 56),
      assetName: a.asset_name ?? a.unit?.slice(56),
      quantity: a.quantity,
    })),
  }));
}

export async function fetchProtocolParameters(
  client: CardanoApiClient,
): Promise<ProtocolParameters> {
  const cacheKey = client.provider + ":" + client.network;
  const cached = protocolParamsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.params;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (client.provider === "blockfrost" && client.apiKey) headers["project_id"] = client.apiKey;

  const url =
    client.provider === "koios"
      ? client.endpoint + "/epoch_params?_epoch_no=current"
      : client.endpoint + "/epochs/latest/parameters";

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error("API error: " + response.status);

  const data = await response.json();
  const raw = Array.isArray(data) ? data[0] : data;

  const params: ProtocolParameters = {
    minFeeA: raw.min_fee_a ?? raw.min_fee_coefficient ?? 44,
    minFeeB: raw.min_fee_b ?? raw.min_fee_constant ?? 155381,
    maxTxSize: raw.max_tx_size ?? 16384,
    minUtxoValue: raw.min_utxo_value ?? "1000000",
    poolDeposit: raw.pool_deposit ?? "500000000",
    keyDeposit: raw.key_deposit ?? "2000000",
    coinsPerUtxoWord: raw.coins_per_utxo_word ?? raw.coins_per_utxo_size ?? "4310",
    maxValSize: raw.max_val_size ?? 5000,
    priceMem: raw.price_mem ?? 0.0577,
    priceStep: raw.price_step ?? 0.0000721,
    collateralPercent: raw.collateral_percent ?? 150,
    maxCollateralInputs: raw.max_collateral_inputs ?? 3,
  };

  protocolParamsCache.set(cacheKey, { params, timestamp: Date.now() });
  return params;
}

export async function submitTransaction(
  client: CardanoApiClient,
  txCbor: string,
): Promise<TxSubmitResult> {
  const headers: Record<string, string> = { "Content-Type": "application/cbor" };
  if (client.provider === "blockfrost" && client.apiKey) headers["project_id"] = client.apiKey;

  const url =
    client.provider === "koios" ? client.endpoint + "/submittx" : client.endpoint + "/tx/submit";

  const response = await fetch(url, { method: "POST", headers, body: Buffer.from(txCbor, "hex") });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = error.error ?? error.message ?? "failed";
    if (msg.toLowerCase().includes("already submitted"))
      throw new Error("Transaction already submitted");
    if (msg.toLowerCase().includes("validation")) throw new Error("Transaction validation failed");
    throw new Error(msg);
  }

  const data = await response.json();
  return { txHash: data.tx_hash ?? data, status: "submitted" };
}

export async function fetchAddressInfo(
  client: CardanoApiClient,
  address: string,
): Promise<{ balance: string; stakeAddress: string | null }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (client.provider === "blockfrost" && client.apiKey) headers["project_id"] = client.apiKey;

  let url: string, options: RequestInit;
  if (client.provider === "koios") {
    url = client.endpoint + "/address_info";
    options = { method: "POST", headers, body: JSON.stringify({ _addresses: [address] }) };
  } else {
    url = client.endpoint + "/addresses/" + address;
    options = { method: "GET", headers };
  }

  const response = await fetch(url, options);
  if (!response.ok) throw new Error("API error: " + response.status);

  const data = await response.json();
  const info = Array.isArray(data) ? data[0] : data;
  return {
    balance: info.balance ?? info.amount?.[0]?.quantity ?? "0",
    stakeAddress: info.stake_address ?? null,
  };
}

export async function fetchTxStatus(
  client: CardanoApiClient,
  txHash: string,
): Promise<{ status: "confirmed" | "pending"; blockHeight?: number }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (client.provider === "blockfrost" && client.apiKey) headers["project_id"] = client.apiKey;

  let url: string, options: RequestInit;
  if (client.provider === "koios") {
    url = client.endpoint + "/tx_info";
    options = { method: "POST", headers, body: JSON.stringify({ _tx_hashes: [txHash] }) };
  } else {
    url = client.endpoint + "/txs/" + txHash;
    options = { method: "GET", headers };
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 404) return { status: "pending" };
    throw new Error("API error: " + response.status);
  }

  const data = await response.json();
  const txInfo = Array.isArray(data) ? data[0] : data;
  if (!txInfo || (Array.isArray(data) && data.length === 0)) return { status: "pending" };
  return { status: "confirmed", blockHeight: txInfo.block_height ?? txInfo.block };
}
