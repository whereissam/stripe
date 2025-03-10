import { NextResponse } from 'next/server';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { HermesClient } from '@pythnetwork/hermes-client';

// SOL/USD Pyth price feed ID
const SOL_USD_PRICE_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, wallet } = body;

    if (!amount || !wallet) {
      return NextResponse.json(
        { error: 'Amount and wallet are required' },
        { status: 400 }
      );
    }

    // Initialize the Hermes client with the public endpoint
    const hermesClient = new HermesClient("https://hermes.pyth.network", {});
    
    // Fetch the latest SOL/USD price from Pyth Network
    const priceUpdates = await hermesClient.getLatestPriceUpdates([SOL_USD_PRICE_ID]);
    
    if (!priceUpdates || !priceUpdates.parsed || !priceUpdates.parsed[0]) {
      throw new Error('Failed to fetch SOL price from Pyth Network');
    }
    
    // The price is nested in parsed[0].price
    const priceData = priceUpdates.parsed[0];
    
    // Log the entire price object for debugging
    console.log('Full price object:', JSON.stringify(priceData, null, 2));
    
    // Pyth prices are typically scaled, we need to check the price and exponent
    const priceObj = priceData.price;
    
    // Determine correct price scaling
    // The exponent is typically negative, like -8, meaning the price should be divided by 10^8
    const priceValue = parseFloat(priceObj.price);
    const priceExponent = priceObj.expo ? parseInt(priceObj.expo) : -8; // Default to -8 if not specified
    
    // Apply correct scaling: price * 10^exponent
    const scaleFactor = Math.pow(10, priceExponent);
    const solPrice = priceValue * scaleFactor;
    
    console.log('Raw price value:', priceValue);
    console.log('Price exponent:', priceExponent);
    console.log('Scale factor:', scaleFactor);
    console.log('Actual SOL/USD price:', solPrice);
    
    if (isNaN(solPrice) || solPrice <= 0) {
      throw new Error(`Invalid price calculation: raw=${priceValue}, exponent=${priceExponent}, result=${solPrice}`);
    }
    
    
    console.log('Current SOL/USD price:', solPrice);
    
    // Add a small buffer for price movements (optional)
    const bufferPercentage = 0.005; // 0.5% buffer
    const adjustedSolPrice = solPrice * (1 + bufferPercentage);
    
    // Convert USD amount to SOL using current price
    const solAmount = amount / adjustedSolPrice;
    
    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);

    // Connect to Solana
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    // Get merchant wallet public key
    const merchantWallet = new PublicKey(
      process.env.MERCHANT_WALLET_ADDRESS || 
      // Replace with your actual wallet for production
      'DummyAddressReplaceMeWithActualMerchantWallet'
    );

    // Get customer wallet public key
    const customerWallet = new PublicKey(wallet);

    console.log('USD amount:', amount);
    console.log('SOL amount:', solAmount.toFixed(9));
    console.log('lamports:', lamports);

    // Create a transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: customerWallet,
        toPubkey: merchantWallet,
        lamports,
      })
    );

    // Get the recent blockhash to include in the transaction
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = customerWallet;

    // Serialize the transaction
    const serializedTransaction = Buffer.from(
      transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      })
    ).toString('base64');

    return NextResponse.json({ 
      transaction: serializedTransaction,
      message: `Transaction created for ${solAmount.toFixed(6)} SOL (${amount} USD)`,
      currentPrice: solPrice,
      adjustedPrice: adjustedSolPrice
    });
  } catch (error) {
    console.error('Error creating Solana transaction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}