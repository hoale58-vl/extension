import { payments } from "bitcoinjs-lib";
import { payments as bitcoinPayments } from "bitcoinjs-lib";
import { AddressType } from "./types";
import { getNetwork } from "@/shared/interfaces/networks";
import * as bitcoinjs from "bitcoinjs-lib";
import * as ecc from "bells-secp256k1";
import { toXOnly } from "./utils";

export class BaseWallet {
  addressType?: AddressType;

  getAddress(publicKey: Uint8Array) {
    if (this.addressType === undefined)
      throw new Error("addressType of keyring is not specified");
    switch (this.addressType) {
      case AddressType.P2WPKH:
        return payments.p2wpkh({
          pubkey: Buffer.from(publicKey),
          network: getNetwork(),
        }).address;
      case AddressType.P2SH_P2WPKH:
        return payments.p2sh({
          redeem: payments.p2wpkh({
            pubkey: Buffer.from(publicKey),
            network: getNetwork(),
          }),
        }).address;
      case AddressType.P2PKH as any:
        return payments.p2pkh({
          pubkey: Buffer.from(publicKey),
          network: getNetwork(),
        }).address;
      case AddressType.P2TR as any:
        bitcoinjs.initEccLib(ecc);
        return bitcoinPayments.p2tr({
          pubkey: toXOnly(Buffer.from(publicKey)),
          network: getNetwork(),
        }).address;
      default:
        throw new Error("Invalid AddressType");
    }
  }
}
