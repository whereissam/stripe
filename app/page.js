'use client';

import { useState } from 'react';
import axios from 'axios';
import { FaCreditCard } from 'react-icons/fa';
import { RiCoinsFill } from 'react-icons/ri';
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
        <div className={styles.paymentMethodContainer}>
          <button 
            onClick={handleStripeCheckout} 
            className={styles.button} 
            disabled={loading}
          >
            <FaCreditCard />
            {loading ? 'Processing...' : 'Pay with Stripe'}
          </button>
          <button 
            onClick={handleBack} 
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            Back
          </button>
        </div>
      );
    } else if (paymentMethod === 'solana') {
      return (
        <WalletProvider>
          <div className={styles.paymentMethodContainer}>
            <WalletConnectButton />
            <SolanaPayButton amount={amount} />
            <button 
              onClick={handleBack} 
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              Back
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
          <FaCreditCard />
          Pay with Stripe
        </button>
        
        <div className={styles.separator}>
          <span>OR</span>
        </div>
        
        <button 
          className={`${styles.button} ${styles.solanaButton}`} 
          onClick={() => setPaymentMethod('solana')}
        >
          <RiCoinsFill />
          Pay with Solana
        </button>
      </div>
    );
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Checkout</h1>
      
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
          <p>This is a secure payment page. Your payment details are encrypted.</p>
          <p><small>For testing Stripe, use card: <strong>4242 4242 4242 4242</strong></small></p>
        </div>
      </div>
    </main>
  );
}