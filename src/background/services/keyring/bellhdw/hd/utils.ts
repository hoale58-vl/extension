import { sha256 } from "@noble/hashes/sha256";
import { payments } from "bitcoinjs-lib";
import varuint from "varuint-bitcoin";

export function magicHashMessage(
  messagePrefix: string,
  text: string
): Uint8Array {
  const messagePrefixBytes = Buffer.from(messagePrefix, "utf8");
  const messageBytes = Buffer.from(text, "utf8");
  const messageVISize = varuint.encodingLength(messageBytes.length);
  const buffer = Buffer.allocUnsafe(
    messagePrefixBytes.length + messageVISize + messageBytes.length
  );
  messagePrefixBytes.copy(buffer, 0);
  varuint.encode(messageBytes.length, buffer, messagePrefixBytes.length);
  messageBytes.copy(buffer, messagePrefixBytes.length + messageVISize);
  return sha256(sha256(buffer));
}

export function encodeSignature(
  signature: Buffer,
  recovery: number,
  compressed: boolean
) {
  if (compressed) recovery += 4;
  return Buffer.concat([Buffer.alloc(1, recovery + 27), signature]);
}

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

function isPaymentFactory(payment: any): (script: Buffer) => boolean {
  return (script: Buffer): boolean => {
    try {
      payment({ output: script });
      return true;
    } catch (err) {
      return false;
    }
  };
}

export const isP2MS = isPaymentFactory(payments.p2ms);
export const isP2PK = isPaymentFactory(payments.p2pk);
export const isP2PKH = isPaymentFactory(payments.p2pkh);
export const isP2WPKH = isPaymentFactory(payments.p2wpkh);
export const isP2WSHScript = isPaymentFactory(payments.p2wsh);
export const isP2SHScript = isPaymentFactory(payments.p2sh);
export const isP2TR = isPaymentFactory(payments.p2tr);

export function isTaprootInput(input: any): boolean {
  return (
    input &&
    !!(
      input.tapInternalKey ||
      input.tapMerkleRoot ||
      (input.tapLeafScript && input.tapLeafScript.length) ||
      (input.tapBip32Derivation && input.tapBip32Derivation.length) ||
      (input.witnessUtxo && isP2TR(input.witnessUtxo.script))
    )
  );
}
