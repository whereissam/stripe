"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQR, encodeURL } from "@solana/pay";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import styles from "./SolanaPayButton.module.css";

const SolanaPayButton = ({ amount }) => {
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const router = useRouter();
  const wallet = useWallet();

  // Handle Solana Pay button click for wallet users
  const handleSolanaPayClick = async () => {
    if (!wallet.connected) {
      setWalletError("Please connect your wallet first");
      return;
    }

    setLoadingWallet(true);
    setWalletError(null);

    try {
      // Call API route to create a Solana Pay transaction
      const response = await fetch("/api/solana-pay/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          wallet: wallet.publicKey.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create Solana transaction"
        );
      }

      const data = await response.json();

      // This is the key fix: properly deserialize the transaction
      try {
        // Convert base64 string to buffer and then to transaction
        const transactionBuffer = Buffer.from(data.transaction, "base64");
        const tx = Transaction.from(transactionBuffer);

        // Sign the transaction
        const signedTx = await wallet.signTransaction(tx);

        // Connect to Solana
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        // Send the signed transaction
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );

        console.log("Transaction sent with signature:", signature);

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(
          signature,
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error(
            "Transaction failed: " + JSON.stringify(confirmation.value.err)
          );
        }

        // Redirect to success page
        router.push(`/solana-success?signature=${signature}&amount=${amount}`);
      } catch (err) {
        console.error("Error processing transaction:", err);
        setWalletError(err.message || "Error processing transaction");
      }
    } catch (err) {
      console.error("Error creating transaction:", err);
      setWalletError(err.message || "Error creating Solana Pay transaction");
    } finally {
      setLoadingWallet(false);
    }
  };

  // Generate and show QR code for mobile users
  const handleShowQR = async () => {
    try {
      // Use a valid default fallback address if no environment variable is set
      let merchantAddress;
      try {
        // Try to use the merchant wallet from env variables
        merchantAddress = new PublicKey(
          process.env.NEXT_PUBLIC_MERCHANT_WALLET ||
            // If not set, use a valid fallback Solana address for testing
            "11111111111111111111111111111111"
        );
      } catch (err) {
        console.error("Invalid merchant address:", err);
        // Use a known valid address as fallback
        merchantAddress = new PublicKey("11111111111111111111111111111111");
      }

      // Create the payment URL
      const url = encodeURL({
        recipient: merchantAddress,
        amount: amount,
        label: "Your Company Name",
        message: "Payment for services",
        memo: `payment-${Date.now()}`,
      });

      // Create QR code
      const qr = createQR(url);

      // Convert to data URL
      const dataURL = await qr.getRawData("png");
      setQrCode(dataURL);
      setShowQR(true);
    } catch (err) {
      console.error("Error generating QR code:", err);
      setWalletError(err.message || "Error generating QR code");
    }
  };

  return (
    <div className={styles.solanaPayContainer}>
      {showQR ? (
        <div className={styles.qrContainer}>
          <h3 className={styles.qrTitle}>
            Scan with a Solana Pay compatible wallet
          </h3>
          {qrCode && (
            <img
              src={qrCode}
              alt="Solana Pay QR Code"
              className={styles.qrCode}
            />
          )}
          <button
            className={styles.backButton}
            onClick={() => setShowQR(false)}
          >
            Back to payment options
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={handleSolanaPayClick}
            disabled={loadingWallet || !wallet.connected}
            className={`${styles.solanaButton} ${styles.primaryButton}`}
          >
            {loadingWallet ? "Processing..." : "Pay with Solana"}
          </button>

          <button
            onClick={handleShowQR}
            className={`${styles.solanaButton} ${styles.secondaryButton}`}
          >
            Show QR Code for Mobile
          </button>

          {walletError && (
            <div className={styles.walletError}>{walletError}</div>
          )}

          {!wallet.connected && (
            <div className={styles.walletNotice}>
              Connect your Solana wallet to pay with SOL
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SolanaPayButton;
