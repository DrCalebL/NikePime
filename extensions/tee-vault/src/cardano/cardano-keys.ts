import * as ed25519 from "@noble/ed25519";
import { blake2b } from "@noble/hashes/blake2b";
import { hmac } from "@noble/hashes/hmac";
/**
 * Cardano HD wallet key derivation following BIP-39 and CIP-1852.
 */
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha512 } from "@noble/hashes/sha512";
import { bech32 } from "bech32";
import * as bip39 from "bip39";
import type { CardanoNetwork } from "./types.js";

export { CARDANO_PURPOSE, CARDANO_COIN_TYPE } from "./types.js";

export interface AccountKeys {
  accountPrivateKey: Buffer;
  accountPublicKey: Buffer;
  accountChainCode: Buffer;
  accountIndex: number;
}

export interface KeyPair {
  privateKey: Buffer;
  publicKey: Buffer;
}

export function generateMnemonic(wordCount: 12 | 15 | 18 | 21 | 24 = 24): string {
  const strengthMap: Record<number, number> = { 12: 128, 15: 160, 18: 192, 21: 224, 24: 256 };
  return bip39.generateMnemonic(strengthMap[wordCount]);
}

export function validateMnemonic(mnemonic: string): boolean {
  if (!mnemonic || typeof mnemonic !== "string") return false;
  return bip39.validateMnemonic(mnemonic);
}

export async function mnemonicToRootKey(
  mnemonic: string,
  passphrase: string = "",
): Promise<Buffer> {
  const entropy = Buffer.from(bip39.mnemonicToEntropy(mnemonic), "hex");
  const seed = pbkdf2(sha512, passphrase, entropy, { c: 4096, dkLen: 96 });
  const privateKey = Buffer.from(seed.slice(0, 64));
  privateKey[0] &= 0xf8;
  privateKey[31] &= 0x7f;
  privateKey[31] |= 0x40;
  const chainCode = Buffer.from(seed.slice(64, 96));
  return Buffer.concat([privateKey, chainCode]);
}

export async function deriveAccountKeys(
  rootKey: Buffer,
  accountIndex: number,
): Promise<AccountKeys> {
  const purpose = 1852 + 0x80000000;
  const coinType = 1815 + 0x80000000;
  const account = accountIndex + 0x80000000;
  let key = rootKey;
  for (const index of [purpose, coinType, account]) {
    key = deriveHardened(key, index);
  }
  const privateKey = key.slice(0, 64);
  const chainCode = key.slice(64, 96);
  const publicKey = await ed25519.getPublicKeyAsync(privateKey.slice(0, 32));
  return {
    accountPrivateKey: Buffer.from(privateKey),
    accountPublicKey: Buffer.from(publicKey),
    accountChainCode: Buffer.from(chainCode),
    accountIndex,
  };
}

export async function derivePaymentKeyPair(
  accountKeys: AccountKeys,
  role: "external" | "internal",
  index: number,
): Promise<KeyPair> {
  const roleIndex = role === "external" ? 0 : 1;
  const roleKey = deriveSoft(
    Buffer.concat([accountKeys.accountPrivateKey, accountKeys.accountChainCode]),
    roleIndex,
  );
  const indexKey = deriveSoft(roleKey, index);
  const privateKey = indexKey.slice(0, 64);
  const publicKey = await ed25519.getPublicKeyAsync(privateKey.slice(0, 32));
  return { privateKey: Buffer.from(privateKey), publicKey: Buffer.from(publicKey) };
}

export async function deriveStakeKeyPair(accountKeys: AccountKeys): Promise<KeyPair> {
  const roleKey = deriveSoft(
    Buffer.concat([accountKeys.accountPrivateKey, accountKeys.accountChainCode]),
    2,
  );
  const indexKey = deriveSoft(roleKey, 0);
  const privateKey = indexKey.slice(0, 64);
  const publicKey = await ed25519.getPublicKeyAsync(privateKey.slice(0, 32));
  return { privateKey: Buffer.from(privateKey), publicKey: Buffer.from(publicKey) };
}

export function publicKeyToHash(publicKey: Buffer): Buffer {
  return Buffer.from(blake2b(publicKey, { dkLen: 28 }));
}

export function hashToAddress(
  paymentHash: Buffer,
  stakeHash: Buffer | undefined,
  network: CardanoNetwork,
): string {
  const networkId = network === "mainnet" ? 1 : 0;
  let header: number;
  let payload: Buffer;
  if (stakeHash) {
    header = (0 << 4) | networkId;
    payload = Buffer.concat([Buffer.from([header]), paymentHash, stakeHash]);
  } else {
    header = (6 << 4) | networkId;
    payload = Buffer.concat([Buffer.from([header]), paymentHash]);
  }
  const prefix = network === "mainnet" ? "addr" : "addr_test";
  const words = bech32.toWords(payload);
  return bech32.encode(prefix, words, 1000);
}

function deriveHardened(parentKey: Buffer, index: number): Buffer {
  const privateKey = parentKey.slice(0, 64);
  const chainCode = parentKey.slice(64, 96);
  const data = Buffer.alloc(1 + 64 + 4);
  data[0] = 0x00;
  privateKey.copy(data, 1);
  data.writeUInt32BE(index, 65);
  const i = hmac(sha512, chainCode, data);
  const il = Buffer.from(i.slice(0, 32));
  const ir = Buffer.from(i.slice(32, 64));
  const newPrivateKey = Buffer.alloc(64);
  let carry = 0n;
  for (let j = 0; j < 32; j++) {
    const sum = BigInt(privateKey[j]) + BigInt(il[j]) + carry;
    newPrivateKey[j] = Number(sum & 0xffn);
    carry = sum >> 8n;
  }
  privateKey.slice(32, 64).copy(newPrivateKey, 32);
  return Buffer.concat([newPrivateKey, ir]);
}

function deriveSoft(parentKey: Buffer, index: number): Buffer {
  const privateKey = parentKey.slice(0, 64);
  const chainCode = parentKey.slice(64, 96);
  const simpleData = Buffer.alloc(1 + 64 + 4);
  simpleData[0] = 0x02;
  privateKey.copy(simpleData, 1);
  simpleData.writeUInt32BE(index, 65);
  const i = hmac(sha512, chainCode, simpleData);
  const il = Buffer.from(i.slice(0, 32));
  const ir = Buffer.from(i.slice(32, 64));
  const newPrivateKey = Buffer.alloc(64);
  let carry = 0n;
  for (let j = 0; j < 32; j++) {
    const sum = BigInt(privateKey[j]) + BigInt(il[j]) + carry;
    newPrivateKey[j] = Number(sum & 0xffn);
    carry = sum >> 8n;
  }
  privateKey.slice(32, 64).copy(newPrivateKey, 32);
  return Buffer.concat([newPrivateKey, ir]);
}
