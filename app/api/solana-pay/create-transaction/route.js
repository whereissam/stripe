import { NextResponse } from 'next/server';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';

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

    // Convert USD amount to SOL (this is a simplified example - in production you'd use a price feed)
    // For this example, let's assume 1 SOL = $20 USD
    const solPrice = 20; // Replace with actual SOL price from an oracle
    const solAmount = amount / solPrice;
    
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
  message: `Transaction created for ${solAmount} SOL (${amount} USD)` 
});
  } catch (error) {
    console.error('Error creating Solana transaction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}