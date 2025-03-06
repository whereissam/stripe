'use client';

import { useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';
import SolanaPayButton from './components/SolanaPayButton';
import WalletConnectButton from './components/WalletConnectButton';
import WalletProvider from './components/WalletProvider';

export default function Home() {
  const [amount, setAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'stripe' or 'solana'
  
  // Handle Stripe Checkout
  const handleStripeCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await axios.post('/api/create-checkout-session', {
        amount: amount * 100,
        currency: 'usd',
      });
      
      window.location.href = data.url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'An error occurred while creating your checkout session.');
      setLoading(false);
    }
  };

  // Reset payment method selection
  const handleBack = () => {
    setPaymentMethod(null);
    setError(null);
  };

  // Render based on selected payment method
  const renderPaymentMethod = () => {
    if (paymentMethod === 'stripe') {
      return (
        <form onSubmit={handleStripeCheckout} className={styles.form}>
          <button 
            type="submit" 
            className={styles.button} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Stripe Checkout'}
          </button>
          <button type="button" className={styles.backButton} onClick={handleBack}>
            Back to Payment Options
          </button>
        </form>
      );
    } else if (paymentMethod === 'solana') {
      return (
        <WalletProvider>
          <div className={styles.solanaPayContainer}>
            <WalletConnectButton />
            <SolanaPayButton amount={amount} />
            <button className={styles.backButton} onClick={handleBack}>
              Back to Payment Options
            </button>
          </div>
        </WalletProvider>
      );
    }

    // Default: Show payment method selection
    return (
      <div className={styles.paymentOptions}>
        <button 
          className={styles.button} 
          onClick={() => setPaymentMethod('stripe')}
        >
          Pay with Stripe
        </button>
        
        <div className={styles.separator}>
          <span>OR</span>
        </div>
        
        <button 
          className={`${styles.button} ${styles.solanaButton}`} 
          onClick={() => setPaymentMethod('solana')}
        >
          Pay with Solana
        </button>
      </div>
    );
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Stripe Checkout Demo</h1>
      
      <div className={styles.checkoutContainer}>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Amount (USD)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="1"
            step="0.01"
            required
            className={styles.input}
            disabled={paymentMethod !== null}
          />
        </div>
        
        {renderPaymentMethod()}
        
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.infoBox}>
          <p>This is a demo of multiple payment options.</p>
          <p>For Stripe testing, use the card number: <strong>4242 4242 4242 4242</strong></p>
          <p>For Solana Pay, connect your wallet when prompted.</p>
        </div>
      </div>
    </main>
  );
}