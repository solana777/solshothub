// Import necessary dependencies
import type { Transaction } from '@solana/web3.js';

import { ComputeBudgetProgram } from '@solana/web3.js';

export const addComputeBudget = (transaction: Transaction) => {
    const priorityFee = localStorage.getItem('priorityFee');

    let computeUnits = 100000; 
    switch (priorityFee) {
        case '50000': // Fast
            computeUnits = 200000;
            break;
        case '100000': // Turbo
            computeUnits = 400000;
            break;
        case '150000': // Ultra
            computeUnits = 600000;
            break;
        default: // Default case
            computeUnits = 100000; // Default value
            break;
    }

    const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: computeUnits,
    });

    transaction.add(computeBudgetInstruction);
    return transaction;
};