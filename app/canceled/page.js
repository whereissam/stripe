'use client';

import Link from 'next/link';
import styles from './canceled.module.css';

export default function Canceled() {
  return (
    <div className={styles.main}>
      <div className={styles.canceledContainer}>
        <div className={styles.canceledIcon}>×</div>
        <h1 className={styles.title}>Payment Canceled</h1>
        <p>Your payment was canceled. No charges were made.</p>
        <Link href="/" className={styles.button}>
          Try Again
        </Link>
      </div>
    </div>
  );
}