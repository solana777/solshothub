import type { Connection} from "@solana/web3.js";

import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { addComputeBudget } from "./priorityFeesIx";

export async function sendPlatformFee(
    connection: Connection,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    publicKey: PublicKey,
    amountSol: number,
    recipientAddress: string
): Promise<string | null> {
    if (!publicKey || !signTransaction) {
        console.error('Wallet not connected or signTransaction not provided');
        return null;
    }

    let transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(recipientAddress),
            lamports: amountSol * LAMPORTS_PER_SOL
        })
    );
    transaction = addComputeBudget(transaction);

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    try {
        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        return signature;
    } catch (error) {
        console.error('Failed to send platform fee:', error);
        return null;
    }
}
