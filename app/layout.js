import './globals.css';

export const metadata = {
  title: 'Stripe Checkout Demo',
  description: 'A demo of Stripe Checkout integration with Next.js',
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