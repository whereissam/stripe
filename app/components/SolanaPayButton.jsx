// components/SolanaPayButton.jsx
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
import { Decimal } from "decimal.js"; // Correct library for Solana Pay
import { RiWallet3Line, RiQrCodeLine } from "react-icons/ri"; // Optional: for icons
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

      try {
        // Properly deserialize the transaction
        const transactionBuffer = Buffer.from(data.transaction, "base64");
        const tx = Transaction.from(transactionBuffer);

        // Sign the transaction with connected wallet
        const signedTx = await wallet.signTransaction(tx);

        // Connect to Solana devnet (change to mainnet for production)
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
      // Use a valid Solana address - the system program if nothing else
      const merchantAddress = new PublicKey(
        process.env.NEXT_PUBLIC_MERCHANT_WALLET ||
          "11111111111111111111111111111111"
      );

      // Using the correct Decimal format that Solana Pay expects
      // This fixes the "amount.decimalPlaces is not a function" error
      const solAmount = new Decimal(amount);

      // Create the payment URL
      const url = encodeURL({
        recipient: merchantAddress,
        amount: solAmount,
        label: "Your Company Name",
        message: "Payment for services",
        memo: `payment-${Date.now()}`,
      });

      // Generate QR code using a reliable approach
      // External QR code service as fallback
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url.toString())}&size=300x300`;
      setQrCode(qrCodeUrl);
      setShowQR(true);
    } catch (err) {
      console.error("Error generating QR code:", err);
      setWalletError(err.message || "Error generating QR code");
    }
  };

  // QR code view
  if (showQR) {
    return (
      <div className={styles.qrContainer}>
        <h3 className={styles.qrTitle}>
          Scan with a Solana Pay compatible wallet
        </h3>
        {qrCode ? (
          <img
            src={qrCode}
            alt="Solana Pay QR Code"
            className={styles.qrCode}
          />
        ) : (
          <div className={styles.loadingQR}>Generating QR code...</div>
        )}
        <button className={styles.backButton} onClick={() => setShowQR(false)}>
          Back to payment options
        </button>
      </div>
    );
  }

  // Normal view (Pay with wallet and QR options)
  return (
    <div className={styles.solanaPayContainer}>
      <button
        onClick={handleSolanaPayClick}
        disabled={loadingWallet || !wallet.connected}
        className={styles.payButton}
      >
        {loadingWallet ? "Processing..." : "Pay with Wallet"}
      </button>

      <button onClick={handleShowQR} className={styles.qrButton}>
        Show QR Code for Mobile
      </button>

      {walletError && <div className={styles.walletError}>{walletError}</div>}

      {!wallet.connected && (
        <div className={styles.walletNotice}>
          Connect your Solana wallet to pay with SOL
        </div>
      )}
    </div>
  );
};

export default SolanaPayButton;
