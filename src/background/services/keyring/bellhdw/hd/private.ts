import {
  bytesToHex as toHex,
  hexToBytes as fromHex,
} from "@noble/hashes/utils";
import { ZERO_KEY, ZERO_PRIVKEY } from "./common";
import type {
  Keyring,
  PrivateKeyOptions,
  SerializedHDKey,
  Hex,
  ToSignInput,
  FromSeedOpts,
  FromMnemonicOpts,
} from "./types";
import { BaseWallet } from "./base";
import * as tinysecp from "bells-secp256k1";
import { mnemonicToSeed } from "bip39";
import ECPairFactory, { ECPairInterface } from "belpair";
import { Psbt } from "belcoinjs-lib";
import HDKey from "browser-hdkey";
import { sha256 } from "@noble/hashes/sha256";
import { getNetwork } from "@/shared/interfaces/networks";
import { encodeSignature, magicHashMessage } from "./utils";

const ECPair = ECPairFactory(tinysecp);

const DEFAULT_HD_PATH = "m/44'/0'/0'/0";

class HDPrivateKey extends BaseWallet implements Keyring<SerializedHDKey> {
  hideRoot?: boolean;

  childIndex: number = 0;
  privateKey: Buffer = ZERO_PRIVKEY;
  publicKey = ZERO_KEY;
  accounts: ECPairInterface[] = [];

  private seed?: Uint8Array;
  private hdWallet?: HDKey;
  private root?: HDKey;
  private hdPath: string = DEFAULT_HD_PATH;

  constructor(options?: PrivateKeyOptions) {
    super();
    if (options) this.fromOptions(options);
  }

  changeHdPath(hdPath: string) {
    this.hdPath = hdPath;
    this.root = this.hdWallet?.derive(this.hdPath);

    this.accounts = [];
  }

  signTypedData(address: string, typedData: Record<string, unknown>) {
    return this.signMessage(address, JSON.stringify(typedData));
  }

  exportPublicKey(address: string) {
    const account = this.findAccount(address);
    return account.publicKey.toString("hex");
  }

  verifyMessage(address: string, text: string, sig: string) {
    const account = this.findAccount(address);
    const hash = sha256(text);
    return account.verify(Buffer.from(hash), Buffer.from(sig, "base64"));
  }

  getAccounts() {
    const accounts = this.accounts.map((w) => {
      return this.getAddress(w.publicKey)!;
    });
    if (this.hideRoot) return accounts;
    return [this.getAddress(this.publicKey!)!, ...accounts];
  }

  addAccounts(number: number = 1) {
    let count = number;
    let currentIdx = this.accounts.length;
    const newAddresses: string[] = [];

    while (count) {
      const wallet = this._addressFromIndex(currentIdx);
      newAddresses.push(this.getAddress(wallet.publicKey)!);

      currentIdx++;
      count--;
    }

    return newAddresses;
  }

  private findAccount(account: Hex): ECPairInterface {
    if (!this.hideRoot) {
      if (this.getAddress(this.publicKey) === account) {
        return ECPair.fromPrivateKey(this.privateKey);
      }
    }
    const foundAccount = this.accounts.find(
      (f) => this.getAddress(f.publicKey) === account
    );
    if (foundAccount !== undefined) {
      return foundAccount;
    }
    throw new Error(
      `HDPrivateKey: Account with address ${account} not founded`
    );
  }

  private findAccountByPk(publicKey: string): ECPairInterface {
    try {
      return this.findAccount(this.getAddress(Buffer.from(publicKey, "hex"))!);
    } catch {
      throw new Error(
        `HDPrivateKey: Account with public key ${publicKey} not founded`
      );
    }
  }

  exportAccount(address: Hex) {
    const account = this.findAccount(address);
    return account.toWIF();
  }

  signPsbt(psbt: Psbt, inputs: ToSignInput[]) {
    let account: ECPairInterface | undefined;

    inputs.map((i) => {
      account = this.findAccountByPk(i.publicKey);
      psbt.signInput(i.index, account, i.sighashTypes);
    });

    psbt.finalizeAllInputs();
  }

  signAllInputsInPsbt(psbt: Psbt, accountAddress: string) {
    const account = this.findAccount(accountAddress);
    psbt.signAllInputs(account);
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
    let account: ECPairInterface | undefined;

    inputs.map((i) => {
      account = this.findAccountByPk(i.publicKey);
      psbt.signInput(i.index, account, i.sighashTypes);
    });

    return psbt.data.inputs.map((f, i) => ({
      inputIndex: i,
      partialSig: f.partialSig?.flatMap((p) => p) ?? [],
    }));
  }

  signMessage(address: Hex, text: string) {
    const account = this.findAccount(address);
    const network = getNetwork();

    // Legacy sign messsage
    const encodedMsg = magicHashMessage(network.messagePrefix, text);
    const { signature, recoveryId } = tinysecp.signRecoverable(
      encodedMsg,
      account.privateKey
    );
    const encodedSig = encodeSignature(
      Buffer.from(signature),
      recoveryId,
      account.compressed
    );

    return encodedSig.toString("base64");

    // TODO: BIP322
  }

  signPersonalMessage(address: Hex, message: Hex) {
    return this.signMessage(address, message);
  }

  async fromOptions(options: PrivateKeyOptions) {
    this.fromSeed({
      seed: Buffer.from(options.seed),
      hdPath: options.hdPath,
    });
    return this;
  }

  static fromOptions(options: PrivateKeyOptions) {
    return new this().fromOptions(options);
  }

  fromSeed(opts: FromSeedOpts) {
    this.childIndex = 0;
    this.seed = opts.seed;
    this.hdWallet = HDKey.fromMasterSeed(Buffer.from(opts.seed));

    if (opts.hdPath) {
      this.hdPath = opts.hdPath;
    }

    this.root = this.hdWallet.derive(this.hdPath);
    this.hideRoot = opts.hideRoot;

    this.privateKey = this.root.privateKey!;
    this.publicKey = this.root.publicKey!;

    this.addressType = opts.addressType;

    return this;
  }

  static fromSeed(opts: FromSeedOpts): HDPrivateKey {
    return new this().fromSeed(opts);
  }

  toggleHideRoot(): void {
    this.hideRoot = !this.hideRoot;
    if (this.hideRoot && !this.accounts.length) {
      this.addAccounts();
    }
  }

  async fromMnemonic(opts: FromMnemonicOpts): Promise<HDPrivateKey> {
    const seed = await mnemonicToSeed(
      opts.mnemonic,
      opts.passphrase ?? "bells"
    );

    this.fromSeed({
      seed,
      hideRoot: opts.hideRoot,
      addressType: opts.addressType,
      hdPath: opts.hdPath,
    });

    return this;
  }

  static fromMnemonic(opts: FromMnemonicOpts): Promise<HDPrivateKey> {
    return new this().fromMnemonic(opts);
  }

  fromPrivateKey(_key: Uint8Array) {
    throw new Error("Method not allowed for HDPrivateKey.");
  }

  static fromPrivateKey(key: Uint8Array) {
    return new this().fromPrivateKey(key);
  }

  private getChildCount(): number {
    return this.accounts.length;
  }

  serialize(): SerializedHDKey {
    if (this.childIndex !== 0)
      throw new Error("You should use only root wallet to serializing");
    return {
      numberOfAccounts: this.getChildCount(),
      seed: toHex(this.seed!),
      addressType: this.addressType!,
      hdPath: this.hdPath !== DEFAULT_HD_PATH ? this.hdPath : undefined,
    };
  }

  static deserialize(opts: SerializedHDKey) {
    if (opts.numberOfAccounts === undefined || !opts.seed) {
      throw new Error(
        "HDPrivateKey: Deserialize method cannot be called with an opts value for numberOfAccounts and no seed"
      );
    }

    const root = HDPrivateKey.fromSeed({
      seed: fromHex(opts.seed),
      hideRoot: opts.hideRoot,
      addressType: opts.addressType,
      hdPath: opts.hdPath,
    });

    root.addAccounts(opts.numberOfAccounts);
    return root;
  }

  deserialize(state: SerializedHDKey) {
    return HDPrivateKey.deserialize(state);
  }

  private _addressFromIndex(i: number): ECPairInterface {
    if (!this.accounts[i]) {
      const child = this.root?.deriveChild(i);
      const ecpair = ECPair.fromPrivateKey(
        Buffer.from((child as any).privateKey)
      );
      this.accounts.push(ecpair);
    }

    return this.accounts[i];
  }
}

export default HDPrivateKey;
