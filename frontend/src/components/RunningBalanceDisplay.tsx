import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatIndianCurrency, formatDisplayAmount } from '../utils/indianNumberFormat';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Plus,
  AlertTriangle,
  DollarSign,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

export interface TransactionWithBalance {
  id: string;
  date: string;
  description?: string;
  creditAmount: number;
  debitAmount: number;
  type: 'credit' | 'debit' | 'anamath';
  ledger?: {
    id: string;
    name: string;
  };
  reference?: string;
  runningBalance?: number;
  balanceImpact?: number;
}

interface RunningBalanceDisplayProps {
  transactions: TransactionWithBalance[];
  openingBalance?: number;
  onTransactionClick?: (transaction: TransactionWithBalance) => void;
  showFilters?: boolean;
  className?: string;
}

const RunningBalanceDisplay: React.FC<RunningBalanceDisplayProps> = ({
  transactions,
  openingBalance = 0,
  onTransactionClick,
  showFilters = true,
  className = ''
}) => {
  const [showRunningBalance, setShowRunningBalance] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit' | 'anamath'>('all');
  const [selectedLedger, setSelectedLedger] = useState<string>('all');

  // Get unique ledgers for filter
  const ledgers = useMemo(() => {
    const uniqueLedgers = transactions.reduce((acc, transaction) => {
      if (transaction.ledger && !acc.find(l => l.id === transaction.ledger!.id)) {
        acc.push(transaction.ledger);
      }
      return acc;
    }, [] as { id: string; name: string }[]);
    return uniqueLedgers;
  }, [transactions]);

  // Filter transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (selectedLedger !== 'all') {
      filtered = filtered.filter(t => t.ledger?.id === selectedLedger);
    }

    return filtered;
  }, [transactions, filterType, selectedLedger]);

  // Calculate running balances for filtered transactions
  const transactionsWithRunningBalance = useMemo(() => {
    let runningBalance = openingBalance;
    
    return filteredTransactions.map((transaction) => {
      const balanceImpact = transaction.type === 'anamath' 
        ? 0 
        : transaction.creditAmount - transaction.debitAmount;
      
      runningBalance += balanceImpact;
      
      return {
        ...transaction,
        runningBalance,
        balanceImpact
      };
    });
  }, [filteredTransactions, openingBalance]);

  const formatCurrency = (amount: number) => {
    return formatIndianCurrency(Math.abs(amount));
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'debit':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'anamath':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'debit':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'anamath':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="w-4 h-4" />;
    if (balance < 0) return <TrendingDown className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header and Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Transaction List</h3>
          </div>

          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-500" />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
              <option value="anamath">Anamath</option>
            </select>

            <select
              value={selectedLedger}
              onChange={(e) => setSelectedLedger(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Ledgers</option>
              {ledgers.map((ledger) => (
                <option key={ledger.id} value={ledger.id}>
                  {ledger.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Opening Balance Display */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Opening Balance</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(openingBalance)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">Filtered Transactions</p>
            <p className="text-lg font-semibold text-blue-900">{transactionsWithRunningBalance.length}</p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ledger
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactionsWithRunningBalance.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onTransactionClick?.(transaction)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                    getTransactionColor(transaction.type)
                  }`}
                >
                  {/* Date & Time */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(transaction.date), 'HH:mm')}
                    </div>
                  </td>

                  {/* Type with Icon */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(transaction.type)}
                      <span className="text-sm font-medium capitalize">
                        {transaction.type}
                      </span>
                    </div>
                  </td>

                  {/* Ledger */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.ledger?.name || 'N/A'}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className={`text-sm font-semibold ${
                      transaction.type === 'credit' ? 'text-green-600' : 
                      transaction.type === 'debit' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {transaction.type === 'credit' && '+'}
                      {transaction.type === 'debit' && '-'}
                      {formatCurrency(transaction.creditAmount || transaction.debitAmount)}
                    </div>
                  </td>

                  {/* Balance Impact */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className={`flex items-center justify-center space-x-1 ${
                      transaction.type === 'anamath' ? 'text-gray-400' : 
                      transaction.balanceImpact! > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'anamath' ? (
                        <span className="text-xs">No Impact</span>
                      ) : (
                        <>
                          {transaction.balanceImpact! > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="text-xs font-medium">
                            {transaction.balanceImpact! > 0 ? '+' : ''}
                            {formatCurrency(transaction.balanceImpact!)}
                          </span>
                        </>
                      )}
                    </div>
                  </td>


                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {transactionsWithRunningBalance.length} transactions
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RunningBalanceDisplay;