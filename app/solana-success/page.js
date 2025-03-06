'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import styles from './solana-success.module.css';

export default function SolanaSuccess() {
  const [loading, setLoading] = useState(true);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  
  const signature = searchParams.get('signature');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!signature) {
        setError('No transaction signature found');
        setLoading(false);
        return;
      }

      try {
        // Connect to Solana devnet (change to mainnet for production)
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        
        // Get transaction details
        const transaction = await connection.getTransaction(signature, {
          commitment: 'confirmed',
        });

        if (!transaction) {
          setError('Transaction not found. It might still be processing.');
          setLoading(false);
          return;
        }

        setTransactionDetails({
          signature,
          amount,
          blockTime: transaction.blockTime 
            ? new Date(transaction.blockTime * 1000).toLocaleString() 
            : 'Unknown',
          status: 'Confirmed'
        });
        
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError(err.message || 'Error fetching transaction details');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [signature, amount]);

  if (loading) {
    return (
      <div className={styles.main}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Verifying transaction...</p>
        </div>
      </div>
    );
  }

  if (error || !signature) {
    return (
      <div className={styles.main}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>!</div>
          <h1 className={styles.title}>Transaction Error</h1>
          <p>{error || 'No transaction information found'}</p>
          <Link href="/" className={styles.button}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.successContainer}>
        <div className={styles.successIcon}>✓</div>
        <h1 className={styles.title}>Solana Payment Successful!</h1>
        
        <div className={styles.transactionDetails}>
          <p><strong>Amount:</strong> {amount} USD</p>
          <p><strong>Transaction ID:</strong> {signature.slice(0, 8)}...{signature.slice(-8)}</p>
          <p><strong>Status:</strong> {transactionDetails?.status || 'Confirmed'}</p>
          <p><strong>Timestamp:</strong> {transactionDetails?.blockTime || 'Processing'}</p>
        </div>
        
        <p>Thank you for your payment using Solana. Your transaction has been confirmed on the blockchain.</p>
        
        <div className={styles.buttonContainer}>
          <Link href="/" className={styles.button}>
            Return to Home
          </Link>
          
          <a 
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.secondaryButton}
          >
            View on Solana Explorer
          </a>
        </div>
      </div>
    </div>
  );
}