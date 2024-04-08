import { sha256 } from "@noble/hashes/sha256";
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
