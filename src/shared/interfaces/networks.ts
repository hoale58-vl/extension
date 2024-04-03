import { Network, networks } from "belcoinjs-lib";
import { COIN_SYMBOL } from "../constant";

export const bitcoin: Network = {
  /**
   * The message prefix used for signing Bitcoin messages.
   */
  messagePrefix: "\x18Bitcoin Signed Message:\n",
  /**
   * The Bech32 prefix used for Bitcoin addresses.
   */
  bech32: "bc",
  /**
   * The BIP32 key prefixes for Bitcoin.
   */
  bip32: {
    /**
     * The public key prefix for BIP32 extended public keys.
     */
    public: 0x0488b21e,
    /**
     * The private key prefix for BIP32 extended private keys.
     */
    private: 0x0488ade4,
  },
  /**
   * The prefix for Bitcoin public key hashes.
   */
  pubKeyHash: 0x00,
  /**
   * The prefix for Bitcoin script hashes.
   */
  scriptHash: 0x05,
  /**
   * The prefix for Bitcoin Wallet Import Format (WIF) private keys.
   */
  wif: 0x80,
};

export const getNetwork = (): Network => {
  switch (COIN_SYMBOL) {
    case "BTC":
      return bitcoin;
    case "tBTC":
      return networks.testnet;
    default:
      return networks.bitcoin;
  }
};
