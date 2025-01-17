import type { PublicKey, Connection } from '@solana/web3.js';

import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import { toast } from 'src/components/snackbar';

export async function checkWalletBalance(
  publicKey: PublicKey,
  connection: Connection,
  serviceFeeInLamports: number
) {
  try {
    const balance = await connection.getBalance(publicKey);
    if (balance < serviceFeeInLamports) {
      toast.error(
        `Insufficient balance. You need at least ${serviceFeeInLamports / LAMPORTS_PER_SOL} SOL to perform this operation.`
      );
      return false;
    }
    return true;
  } catch (error) {
    toast.error('Failed to check wallet balance. Please try again.');
    return false;
  }
}
