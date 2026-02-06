/**
 * Cardano wallet type definitions for Lace-compatible HD wallet integration.
 */

export type CardanoNetwork = "mainnet" | "preprod" | "preview";
export const CARDANO_PURPOSE = 1852;
export const CARDANO_COIN_TYPE = 1815;
export type AddressRole = "external" | "internal" | "stake";
export const ADDRESS_ROLE_INDEX = { external: 0, internal: 1, stake: 2 } as const;
export type CardanoKeyType = "mnemonic" | "root_key" | "payment_key" | "stake_key";

export interface CardanoAccount {
  index: number;
  name: string;
  network: CardanoNetwork;
  createdAt: string;
}

export interface DerivationPath {
  purpose: number;
  coinType: number;
  account: number;
  role: number;
  index: number;
}

export interface CardanoAddress {
  address: string;
  path: DerivationPath;
  role: AddressRole;
  index: number;
}

export interface CardanoUtxo {
  txHash: string;
  outputIndex: number;
  address: string;
  lovelace: string;
  assets?: CardanoAsset[];
}

export interface CardanoAsset {
  policyId: string;
  assetName: string;
  quantity: string;
}

export interface TxOutput {
  address: string;
  lovelace: string;
  assets?: CardanoAsset[];
}

export interface UnsignedTx {
  body: string;
  hash: string;
  fee: string;
  requiredSigners: string[];
}

export interface SignedTx {
  tx: string;
  hash: string;
}

export interface TxSubmitResult {
  txHash: string;
  status: "submitted" | "pending" | "confirmed" | "failed";
  message?: string;
}

export interface WalletBalance {
  lovelace: string;
  assets: CardanoAsset[];
  utxoCount: number;
}

export interface SpendingLimits {
  perTransaction: string;
  daily: string;
  requireConfirmation: string;
}

export interface CardanoWalletConfig {
  label: string;
  network: CardanoNetwork;
  accountIndex: number;
  spendingLimits: SpendingLimits;
  addressGapLimit: number;
  createdAt: string;
  lastSyncAt?: string;
}

export interface CardanoWalletState {
  externalAddresses: CardanoAddress[];
  internalAddresses: CardanoAddress[];
  stakeAddress?: CardanoAddress;
  utxos: CardanoUtxo[];
  balance: WalletBalance;
  updatedAt: string;
}

export interface CardanoApiConfig {
  provider: "koios" | "blockfrost";
  network: CardanoNetwork;
  apiKey?: string;
  endpoint?: string;
}

export const KOIOS_ENDPOINTS: Record<CardanoNetwork, string> = {
  mainnet: "https://api.koios.rest/api/v1",
  preprod: "https://preprod.koios.rest/api/v1",
  preview: "https://preview.koios.rest/api/v1",
};

export const BLOCKFROST_ENDPOINTS: Record<CardanoNetwork, string> = {
  mainnet: "https://cardano-mainnet.blockfrost.io/api/v0",
  preprod: "https://cardano-preprod.blockfrost.io/api/v0",
  preview: "https://cardano-preview.blockfrost.io/api/v0",
};

export interface ProtocolParameters {
  minFeeA: number;
  minFeeB: number;
  maxTxSize: number;
  minUtxoValue: string;
  poolDeposit: string;
  keyDeposit: string;
  coinsPerUtxoWord: string;
  maxValSize: number;
  priceMem: number;
  priceStep: number;
  collateralPercent: number;
  maxCollateralInputs: number;
}
