import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatIndianCurrency, formatDisplayAmount } from '../utils/indianNumberFormat';
import { 
  ToggleLeft, 
  ToggleRight, 
  Filter,
  Grid,
  List,
  Eye,
  EyeOff
} from 'lucide-react';
import EnhancedTransactionList, { EnhancedTransaction } from './EnhancedTransactionList';
import RunningBalanceDisplay, { TransactionWithBalance } from './RunningBalanceDisplay';

interface TransactionListEnhancedProps {
  transactions: EnhancedTransaction[];
  openingBalance?: number;
  onTransactionClick?: (transaction: EnhancedTransaction) => void;
  className?: string;
}

type ViewMode = 'enhanced' | 'table';

const TransactionListEnhanced: React.FC<TransactionListEnhancedProps> = ({
  transactions,
  openingBalance = 0,
  onTransactionClick,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('enhanced');
  const [showBalanceImpact, setShowBalanceImpact] = useState(true);

  // Transform transactions for RunningBalanceDisplay if needed
  const transformedTransactions: TransactionWithBalance[] = useMemo(() => {
    return transactions.map(transaction => ({
      ...transaction,
      // Ensure all required fields are present
      creditAmount: transaction.creditAmount || 0,
      debitAmount: transaction.debitAmount || 0,
    }));
  }, [transactions]);

  // Calculate running balances
  const transactionsWithRunningBalance: EnhancedTransaction[] = useMemo(() => {
    let runningBalance = openingBalance;
    
    return transactions.map((transaction) => {
      const balanceImpact = transaction.type === 'anamath' 
        ? 0 
        : (transaction.creditAmount || 0) - (transaction.debitAmount || 0);
      
      runningBalance += balanceImpact;
      
      return {
        ...transaction,
        runningBalance,
        balanceImpact
      };
    });
  }, [transactions, openingBalance]);

  const handleTransactionClick = (transaction: EnhancedTransaction | TransactionWithBalance) => {
    onTransactionClick?.(transaction as EnhancedTransaction);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {transactions.length} transactions
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Balance Impact Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBalanceImpact(!showBalanceImpact)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              showBalanceImpact 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showBalanceImpact ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Balance Impact</span>
          </motion.button>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('enhanced')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'enhanced'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Enhanced</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Table</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Opening Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="text-sm font-medium text-blue-600">Opening Balance</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatIndianCurrency(openingBalance)}
          </div>
        </div>
        
        <div className="card p-4 bg-green-50 border-green-200">
          <div className="text-sm font-medium text-green-600">Total Credits</div>
          <div className="text-2xl font-bold text-green-900">
            {formatIndianCurrency(transactions
              .filter(t => t.type === 'credit')
              .reduce((sum, t) => sum + (t.creditAmount || 0), 0))}
          </div>
        </div>
        
        <div className="card p-4 bg-red-50 border-red-200">
          <div className="text-sm font-medium text-red-600">Total Debits</div>
          <div className="text-2xl font-bold text-red-900">
            {formatIndianCurrency(transactions
              .filter(t => t.type === 'debit')
              .reduce((sum, t) => sum + (t.debitAmount || 0), 0))}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {viewMode === 'enhanced' ? (
          <EnhancedTransactionList
            transactions={transactionsWithRunningBalance}
            onTransactionClick={handleTransactionClick}
            showBalanceImpact={showBalanceImpact}
          />
        ) : (
          <RunningBalanceDisplay
            transactions={transformedTransactions}
            openingBalance={openingBalance}
            onTransactionClick={handleTransactionClick}
            showFilters={true}
          />
        )}
      </motion.div>

      {/* Summary Footer */}
      {transactionsWithRunningBalance.length > 0 && (
        <div className="card p-4 bg-gray-50 border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Final Balance after {transactions.length} transactions
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Closing Balance</div>
              <div className={`text-xl font-bold ${
                transactionsWithRunningBalance[transactionsWithRunningBalance.length - 1]?.runningBalance! > 0 
                  ? 'text-green-600' 
                  : transactionsWithRunningBalance[transactionsWithRunningBalance.length - 1]?.runningBalance! < 0 
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`}>
                {formatIndianCurrency(transactionsWithRunningBalance[transactionsWithRunningBalance.length - 1]?.runningBalance || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionListEnhanced;