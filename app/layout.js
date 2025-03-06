import './globals.css';

export const metadata = {
  title: 'Payment Demo - Stripe & Solana Pay',
  description: 'A demo of multiple payment options including Stripe and Solana Pay',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}