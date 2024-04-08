import { Keyring, SerializedSimpleKey, ToSignInput } from "./types";
import { ZERO_KEY, ZERO_PRIVKEY } from "./common";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { BaseWallet } from "./base";
import * as tinysecp from "bells-secp256k1";
import ECPairFactory, { ECPairInterface } from "belpair";
import { Psbt, crypto } from "bitcoinjs-lib";
import { signBip322 } from "./bip322";
import { isP2TR, isTaprootInput, toXOnly } from "./utils";

const ECPair = ECPairFactory(tinysecp);

class HDSimpleKey extends BaseWallet implements Keyring<SerializedSimpleKey> {
  privateKey: Uint8Array = ZERO_PRIVKEY;
  publicKey = ZERO_KEY;

  private pair?: ECPairInterface;

  constructor(privateKey: Uint8Array) {
    super();

    this.privateKey = privateKey;
  }

  private initPair() {
    if (!this.privateKey)
      throw new Error("Simple Keyring: Invalid privateKey provided");
    if (!this.pair) {
      this.pair = ECPair.fromPrivateKey(Buffer.from(this.privateKey));
      this.publicKey = this.pair.publicKey;
    }
  }

  signTypedData(address: string, typedData: Record<string, unknown>) {
    this.initPair();

    return this.signMessage(address, JSON.stringify(typedData));
  }

  verifyMessage(_address: string, text: string, sig: string) {
    this.initPair();

    return this.pair!.verify(
      Buffer.from(hexToBytes(text)),
      Buffer.from(hexToBytes(sig))
    )!;
  }

  getAccounts() {
    this.initPair();

    return [this.getAddress(this.publicKey)!];
  }

  serialize() {
    this.initPair();

    const wif = this.pair?.toWIF();
    if (!wif) throw new Error("Failed to export wif for simple wallet");

    return {
      privateKey: wif,
      addressType: this.addressType!,
    };
  }

  deserialize(state: SerializedSimpleKey) {
    const wallet = HDSimpleKey.deserialize(state);
    this.privateKey = wallet.privateKey;
    this.pair = wallet.pair;
    this.addressType = wallet.addressType;
    return this;
  }

  static deserialize(state: SerializedSimpleKey) {
    let pair: ECPairInterface | undefined;

    if (state.isHex) {
      pair = ECPair.fromPrivateKey(Buffer.from(state.privateKey, "hex"));
    } else {
      pair = ECPair.fromWIF(state.privateKey);
    }

    const wallet = new this(pair.privateKey!);
    wallet.initPair();
    wallet.addressType = state.addressType;
    return wallet;
  }

  exportAccount(
    _address: string,
    _options?: Record<string, unknown> | undefined
  ) {
    this.initPair();

    return this.pair!.toWIF();
  }

  exportPublicKey(_address: string) {
    this.initPair();

    return bytesToHex(this.publicKey);
  }

  signPsbt(psbt: Psbt, inputs: ToSignInput[]) {
    this.initPair();

    for (let i of inputs) {
      // add internal key as account pubkey for taproot input
      const psbtInput = psbt.data.inputs[i.index];
      if (isTaprootInput(psbtInput)) {
        psbt.data.inputs[i.index].tapInternalKey = toXOnly(this.pair.publicKey);
        const tweakedSigner = this.pair.tweak(
          crypto.taggedHash("TapTweak", toXOnly(this.pair.publicKey))
        );
        psbt.signTaprootInput(i.index, tweakedSigner);
      } else {
        psbt.signInput(i.index, this.pair!, i.sighashTypes);
      }
    }
    psbt.finalizeAllInputs();
  }

  signAllInputsInPsbt(psbt: Psbt, accountAddress: string) {
    this.initPair();
    if (this.pair === undefined)
      throw new Error("Cannot sign all inputs since pair is undefined");
    if (accountAddress !== this.getAddress(this.publicKey))
      throw new Error(
        "Provided account address does not match the wallet's address"
      );
    psbt.signAllInputs(this.pair!);
    return {
      signatures: psbt.data.inputs.map((i) => {
        if (
          i.partialSig &&
          i.partialSig[0] &&
          i.partialSig[0].signature.length
        ) {
          return i.partialSig[0].signature.toString("hex");
        }
      }),
    };
  }

  signInputsWithoutFinalizing(
    psbt: Psbt,
    inputs: ToSignInput[]
  ): {
    inputIndex: number;
    partialSig: { pubkey: Buffer; signature: Buffer }[];
  }[] {
    this.initPair();
    if (this.pair === undefined)
      throw new Error("Cannot sign inputs since pair is undefined");
    for (let i of inputs) {
      // add internal key as account pubkey for taproot input
      const psbtInput = psbt.data.inputs[i.index];
      if (isTaprootInput(psbtInput)) {
        psbt.data.inputs[i.index].tapInternalKey = toXOnly(this.pair.publicKey);
        const tweakedSigner = this.pair.tweak(
          crypto.taggedHash("TapTweak", toXOnly(this.pair.publicKey))
        );
        psbt.signTaprootInput(i.index, tweakedSigner);
      } else {
        psbt.signInput(i.index, this.pair!, i.sighashTypes);
      }
    }
    return psbt.data.inputs.map((f, i) => ({
      inputIndex: i,
      partialSig: f.partialSig?.flatMap((p) => p) ?? [],
    }));
  }

  signMessage(address: string, text: string) {
    this.initPair();
    return signBip322(address, text, this.pair);
  }

  signPersonalMessage(address: string, message: string) {
    return this.signMessage(address, message);
  }
}

export default HDSimpleKey;
