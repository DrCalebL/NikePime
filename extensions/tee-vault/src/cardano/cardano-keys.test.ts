/**
 * Tests for Cardano HD wallet key derivation.
 *
 * Follows BIP-39 (mnemonic) and CIP-1852 (Cardano HD paths).
 */
import { describe, it, expect } from "vitest";
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToRootKey,
  deriveAccountKeys,
  derivePaymentKeyPair,
  deriveStakeKeyPair,
  publicKeyToHash,
  hashToAddress,
  CARDANO_PURPOSE,
  CARDANO_COIN_TYPE,
} from "./cardano-keys.js";

describe("cardano-keys", () => {
  // Test vectors from CIP-1852 and Lace wallet
  const TEST_MNEMONIC = "test walk nut penalty hip pave soap entry language right filter choice";
  const TEST_MNEMONIC_24 =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";

  describe("generateMnemonic", () => {
    it("generates a valid 24-word mnemonic by default", () => {
      const mnemonic = generateMnemonic();
      const words = mnemonic.split(" ");
      expect(words.length).toBe(24);
      expect(validateMnemonic(mnemonic)).toBe(true);
    });

    it("generates a valid 15-word mnemonic when requested", () => {
      const mnemonic = generateMnemonic(15);
      const words = mnemonic.split(" ");
      expect(words.length).toBe(15);
      expect(validateMnemonic(mnemonic)).toBe(true);
    });

    it("generates unique mnemonics each time", () => {
      const a = generateMnemonic();
      const b = generateMnemonic();
      expect(a).not.toBe(b);
    });
  });

  describe("validateMnemonic", () => {
    it("accepts valid 12-word mnemonic", () => {
      expect(validateMnemonic(TEST_MNEMONIC)).toBe(true);
    });

    it("accepts valid 24-word mnemonic", () => {
      expect(validateMnemonic(TEST_MNEMONIC_24)).toBe(true);
    });

    it("rejects invalid mnemonic with wrong words", () => {
      expect(validateMnemonic("invalid words that are not in bip39 wordlist")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(validateMnemonic("")).toBe(false);
    });
  });

  describe("mnemonicToRootKey", () => {
    it("derives a root key from mnemonic", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      expect(rootKey).toBeInstanceOf(Buffer);
      expect(rootKey.length).toBe(96); // Extended private key (64) + chain code (32)
    });

    it("is deterministic for same mnemonic", async () => {
      const a = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const b = await mnemonicToRootKey(TEST_MNEMONIC_24);
      expect(a.equals(b)).toBe(true);
    });

    it("produces different keys for different mnemonics", async () => {
      const a = await mnemonicToRootKey(TEST_MNEMONIC);
      const b = await mnemonicToRootKey(TEST_MNEMONIC_24);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("deriveAccountKeys", () => {
    it("derives account keys following CIP-1852 path", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const accountKeys = await deriveAccountKeys(rootKey, 0);

      expect(accountKeys.accountPrivateKey).toBeInstanceOf(Buffer);
      expect(accountKeys.accountPublicKey).toBeInstanceOf(Buffer);
      expect(accountKeys.accountIndex).toBe(0);
    });

    it("produces different keys for different account indices", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const account0 = await deriveAccountKeys(rootKey, 0);
      const account1 = await deriveAccountKeys(rootKey, 1);

      expect(account0.accountPrivateKey.equals(account1.accountPrivateKey)).toBe(false);
    });
  });

  describe("derivePaymentKeyPair", () => {
    it("derives payment key pair for external address", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const accountKeys = await deriveAccountKeys(rootKey, 0);
      const paymentKeys = await derivePaymentKeyPair(accountKeys, "external", 0);

      expect(paymentKeys.privateKey).toBeInstanceOf(Buffer);
      expect(paymentKeys.publicKey).toBeInstanceOf(Buffer);
      expect(paymentKeys.publicKey.length).toBe(32); // Ed25519 public key
    });

    it("derives different keys for internal vs external", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const accountKeys = await deriveAccountKeys(rootKey, 0);
      const external = await derivePaymentKeyPair(accountKeys, "external", 0);
      const internal = await derivePaymentKeyPair(accountKeys, "internal", 0);

      expect(external.publicKey.equals(internal.publicKey)).toBe(false);
    });
  });

  describe("deriveStakeKeyPair", () => {
    it("derives stake key pair", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const accountKeys = await deriveAccountKeys(rootKey, 0);
      const stakeKeys = await deriveStakeKeyPair(accountKeys);

      expect(stakeKeys.privateKey).toBeInstanceOf(Buffer);
      expect(stakeKeys.publicKey).toBeInstanceOf(Buffer);
      expect(stakeKeys.publicKey.length).toBe(32);
    });
  });

  describe("publicKeyToHash", () => {
    it("hashes public key to 28 bytes (Blake2b-224)", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const accountKeys = await deriveAccountKeys(rootKey, 0);
      const paymentKeys = await derivePaymentKeyPair(accountKeys, "external", 0);
      const hash = publicKeyToHash(paymentKeys.publicKey);

      expect(hash).toBeInstanceOf(Buffer);
      expect(hash.length).toBe(28);
    });
  });

  describe("hashToAddress", () => {
    it("creates mainnet base address with payment and stake hash", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const accountKeys = await deriveAccountKeys(rootKey, 0);
      const paymentKeys = await derivePaymentKeyPair(accountKeys, "external", 0);
      const stakeKeys = await deriveStakeKeyPair(accountKeys);

      const paymentHash = publicKeyToHash(paymentKeys.publicKey);
      const stakeHash = publicKeyToHash(stakeKeys.publicKey);

      const address = hashToAddress(paymentHash, stakeHash, "mainnet");
      expect(address).toMatch(/^addr1[a-z0-9]+$/);
    });

    it("creates preprod base address", async () => {
      const rootKey = await mnemonicToRootKey(TEST_MNEMONIC_24);
      const accountKeys = await deriveAccountKeys(rootKey, 0);
      const paymentKeys = await derivePaymentKeyPair(accountKeys, "external", 0);
      const stakeKeys = await deriveStakeKeyPair(accountKeys);

      const paymentHash = publicKeyToHash(paymentKeys.publicKey);
      const stakeHash = publicKeyToHash(stakeKeys.publicKey);

      const address = hashToAddress(paymentHash, stakeHash, "preprod");
      expect(address).toMatch(/^addr_test1[a-z0-9]+$/);
    });
  });

  describe("CIP-1852 path constants", () => {
    it("uses correct purpose and coin type", () => {
      expect(CARDANO_PURPOSE).toBe(1852);
      expect(CARDANO_COIN_TYPE).toBe(1815);
    });
  });
});
