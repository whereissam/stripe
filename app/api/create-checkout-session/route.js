import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd' } = body;

    // Log the request details for debugging
    console.log('Creating checkout session with:', { amount, currency });

    // Create a Checkout Session with multiple payment methods
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card',           // This includes Apple Pay/Google Pay automatically
        'us_bank_account', // For ACH direct debit payments
        // Additional payment methods based on your region:
        // 'klarna',      // Buy now pay later - EU and US
        // 'afterpay_clearpay', // Buy now pay later - US, UK, AU, NZ, CA
        'paypal',      // PayPal - most regions
        // 'affirm',      // Buy now pay later - US only
        // 'link',        // Stripe Link autofill - Global
        // 'cashapp',     // Cash App Pay - US only
      ],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Payment',
              description: 'Payment for services',
            },
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Add billing address collection for certain payment methods
      billing_address_collection: 'auto',
      // Configure payment method options if needed
      payment_method_options: {
        us_bank_account: {
          financial_connections: {
            permissions: ['payment_method', 'balances'],
          },
        },
      },
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/canceled`,
    });

    // Return the session URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}