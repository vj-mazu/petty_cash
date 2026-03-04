import React from 'react';
import RunningBalanceDisplay, { TransactionWithBalance } from './RunningBalanceDisplay';
import { Transaction } from '../services/api';

interface TransactionListWithRunningBalanceProps {
  transactions: Transaction[];
  openingBalance?: number;
  onTransactionClick?: (transaction: TransactionWithBalance) => void;
  className?: string;
}

const TransactionListWithRunningBalance: React.FC<TransactionListWithRunningBalanceProps> = ({
  transactions,
  openingBalance = 0,
  onTransactionClick,
  className = ''
}) => {
  // Transform API transactions to the format expected by RunningBalanceDisplay
  const transformedTransactions: TransactionWithBalance[] = transactions.map((transaction) => {
    // Determine transaction type based on amounts
    let type: 'credit' | 'debit' | 'anamath' = 'credit';
    if (transaction.debitAmount > 0) {
      type = 'debit';
    } else if (transaction.creditAmount > 0) {
      type = 'credit';
    }
    
    // Check if it's an anamath transaction (you might need to adjust this logic based on your data structure)
    if (transaction.remarks?.toLowerCase().includes('anamath') || 
        transaction.reference?.toLowerCase().includes('anamath')) {
      type = 'anamath';
    }

    return {
      id: transaction.id,
      date: transaction.date,
      creditAmount: transaction.creditAmount || 0,
      debitAmount: transaction.debitAmount || 0,
      type,
      ledger: transaction.ledger ? {
        id: transaction.ledger.id,
        name: transaction.ledger.name
      } : undefined,
      reference: transaction.reference
    };
  });

  return (
    <RunningBalanceDisplay
      transactions={transformedTransactions}
      openingBalance={openingBalance}
      onTransactionClick={onTransactionClick}
      showFilters={true}
      className={className}
    />
  );
};

export default TransactionListWithRunningBalance;