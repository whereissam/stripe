'use client';

import { useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';
import SolanaPayButton from '../components/SolanaPayButton';

export default function Home() {
  const [amount, setAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle Stripe Checkout form submission
  const handleStripeCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Call API route to create Checkout Session
      const { data } = await axios.post('/api/create-checkout-session', {
        amount: amount * 100, // Convert to cents
        currency: 'usd',
      });
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'An error occurred while creating your checkout session.');
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Stripe Checkout Demo</h1>
      
      <div className={styles.checkoutContainer}>
        <form onSubmit={handleStripeCheckout} className={styles.form}>
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
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.button} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Checkout with Stripe'}
          </button>
          
          {error && <div className={styles.error}>{error}</div>}
        </form>
        
        <div className={styles.separator}>
          <span>OR</span>
        </div>
        
        {/* Solana Pay Button Component */}
        <SolanaPayButton amount={amount} />
        
        <div className={styles.infoBox}>
          <p>This is a demo of Stripe Checkout. After clicking Checkout with Stripe, you will be redirected to Stripe hosted checkout page.</p>
          <p>For testing, you can use the card number: <strong>4242 4242 4242 4242</strong></p>
          <p>Alternatively, you can pay with Solana by connecting your wallet and confirming the transaction.</p>
        </div>
      </div>
    </main>
  );
}