"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import styles from "./WalletConnectButton.module.css";

const WalletConnectButton = () => {
  const { connected, publicKey } = useWallet();

  return (
    <div className={styles.walletButtonContainer}>
      <WalletMultiButton className={styles.walletButton} />

      {connected && publicKey && (
        <div className={styles.connectedStatus}>
          Connected: {publicKey.toString().slice(0, 4)}...
          {publicKey.toString().slice(-4)}
        </div>
      )}
    </div>
  );
};

export default WalletConnectButton;
