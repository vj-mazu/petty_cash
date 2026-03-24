import React from 'react';
import RunningBalanceDisplay, { TransactionWithBalance } from './RunningBalanceDisplay';

// Demo component to showcase the RunningBalanceDisplay functionality
const RunningBalanceDemo: React.FC = () => {
  // Sample transaction data for demonstration
  const sampleTransactions: TransactionWithBalance[] = [
    {
      id: '1',
      date: '2024-01-15T09:00:00Z',
      description: 'Opening cash deposit',
      creditAmount: 10000,
      debitAmount: 0,
      type: 'credit',
      ledger: { id: 'cash', name: 'Cash Account' },
      reference: 'REF001'
    },
    {
      id: '2',
      date: '2024-01-15T10:30:00Z',
      description: 'Office supplies purchase',
      creditAmount: 0,
      debitAmount: 1500,
      type: 'debit',
      ledger: { id: 'expenses', name: 'Office Expenses' },
      reference: 'REF002'
    },
    {
      id: '3',
      date: '2024-01-15T11:15:00Z',
      description: 'Anamath entry for reconciliation',
      creditAmount: 0,
      debitAmount: 500,
      type: 'anamath',
      ledger: { id: 'anamath', name: 'Anamath Account' },
      reference: 'ANA001'
    },
    {
      id: '4',
      date: '2024-01-15T14:20:00Z',
      description: 'Client payment received',
      creditAmount: 5000,
      debitAmount: 0,
      type: 'credit',
      ledger: { id: 'receivables', name: 'Accounts Receivable' },
      reference: 'REF003'
    },
    {
      id: '5',
      date: '2024-01-15T16:45:00Z',
      description: 'Rent payment',
      creditAmount: 0,
      debitAmount: 3000,
      type: 'debit',
      ledger: { id: 'rent', name: 'Rent Expense' },
      reference: 'REF004'
    }
  ];

  const handleTransactionClick = (transaction: TransactionWithBalance) => {
    console.log('Transaction clicked:', transaction);
    // You can implement navigation or modal opening here
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Running Balance Display Demo
        </h1>
        <p className="text-gray-600">
          This demo shows the RunningBalanceDisplay component with sample transaction data.
        </p>
      </div>

      <RunningBalanceDisplay
        transactions={sampleTransactions}
        openingBalance={5000}
        onTransactionClick={handleTransactionClick}
        showFilters={true}
        className="max-w-6xl mx-auto"
      />

      <div className="card p-6 bg-blue-50 border-blue-200 max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Features Demonstrated:</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✅ Running balance calculation that updates with each transaction</li>
          <li>✅ Color-coded transaction types (Green for Credit, Red for Debit, Amber for Anamath)</li>
          <li>✅ Visual indicators showing balance impact for each transaction</li>
          <li>✅ Filtering by transaction type and ledger</li>
          <li>✅ Toggle to show/hide running balance column</li>
          <li>✅ Anamath transactions don't affect balance calculations</li>
          <li>✅ Responsive design with smooth animations</li>
          <li>✅ Click handlers for transaction details</li>
        </ul>
      </div>
    </div>
  );
};

export default RunningBalanceDemo;