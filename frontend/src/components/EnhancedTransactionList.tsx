import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIndianCurrency, formatDisplayAmount } from '../utils/indianNumberFormat';
import { 
  Plus, 
  Minus, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Calendar,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  Pause,
  Play,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

export interface EnhancedTransaction {
  id: string;
  date: string;
  creditAmount: number;
  debitAmount: number;
  type: 'credit' | 'debit' | 'anamath';
  transactionType?: 'regular' | 'combined' | 'anamath';
  description?: string;
  remarks?: string;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspendedBy?: string;
  ledger?: {
    id: string;
    name: string;
  };
  reference?: string;
  createdBy?: string;
  balanceImpact?: number;
  runningBalance?: number;
  affectsBalance?: boolean;
}

interface EnhancedTransactionListProps {
  transactions: EnhancedTransaction[];
  onTransactionClick?: (transaction: EnhancedTransaction) => void;
  onSuspendTransaction?: (transactionId: string, reason?: string) => void;
  onUnsuspendTransaction?: (transactionId: string, reason?: string) => void;
  showBalanceImpact?: boolean;
  className?: string;
}

const EnhancedTransactionList: React.FC<EnhancedTransactionListProps> = ({
  transactions,
  onTransactionClick,
  onSuspendTransaction,
  onUnsuspendTransaction,
  showBalanceImpact = true,
  className = ''
}) => {
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return formatIndianCurrency(Math.abs(amount));
  };

  const getTransactionIndicator = (type: string, transactionType?: string) => {
    // First check if it's a combined transaction
    if (transactionType === 'combined') {
      return {
        icon: <Plus className="w-5 h-5" />,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        label: 'Combined',
        symbol: 'A'  // 'A' indicator for combined transactions
      };
    }

    switch (type) {
      case 'credit':
        return {
          icon: <Plus className="w-5 h-5" />,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          label: 'Credit',
          symbol: '+'
        };
      case 'debit':
        return {
          icon: <Minus className="w-5 h-5" />,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          label: 'Debit',
          symbol: '-'
        };
      case 'anamath':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-amber-100',
          iconColor: 'text-amber-600',
          borderColor: 'border-amber-200',
          label: 'Anamath',
          symbol: '⚠'
        };
      default:
        return {
          icon: <DollarSign className="w-5 h-5" />,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          symbol: '?'
        };
    }
  };

  const getTransactionRowStyle = (type: string, isSuspended?: boolean) => {
    const baseStyle = isSuspended ? 'bg-gray-100 hover:bg-gray-200 opacity-60 ' : '';
    
    switch (type) {
      case 'credit':
        return baseStyle + (isSuspended ? 'border-l-4 border-l-gray-400' : 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500');
      case 'debit':
        return baseStyle + (isSuspended ? 'border-l-4 border-l-gray-400' : 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500');
      case 'anamath':
        return baseStyle + (isSuspended ? 'border-l-4 border-l-gray-400' : 'bg-amber-50 hover:bg-amber-100 border-l-4 border-l-amber-500');
      default:
        return baseStyle + (isSuspended ? 'border-l-4 border-l-gray-400' : 'bg-gray-50 hover:bg-gray-100 border-l-4 border-l-gray-500');
    }
  };

  const getBalanceImpactDisplay = (transaction: EnhancedTransaction) => {
    if (transaction.type === 'anamath') {
      return (
        <div className="flex items-center space-x-1 text-amber-600">
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">No Balance Impact</span>
        </div>
      );
    }

    const impact = transaction.balanceImpact || (transaction.creditAmount - transaction.debitAmount);
    const isPositive = impact > 0;

    return (
      <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{formatCurrency(impact)}
        </span>
      </div>
    );
  };

  const toggleTransactionDetails = (transactionId: string) => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId);
  };

  const handleSuspendAction = (transactionId: string, isSuspended: boolean) => {
    if (isSuspended) {
      onUnsuspendTransaction?.(transactionId, suspendReason);
    } else {
      onSuspendTransaction?.(transactionId, suspendReason);
    }
    setSuspendReason('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {transactions.map((transaction, index) => {
        const indicator = getTransactionIndicator(transaction.type, transaction.transactionType);
        const isExpanded = expandedTransaction === transaction.id;
        const amount = transaction.creditAmount || transaction.debitAmount;

        return (
          console.log('Transaction object in EnhancedTransactionList:', transaction),
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`card overflow-hidden transition-all duration-200 ${getTransactionRowStyle(transaction.type, transaction.isSuspended)} ${transaction.isSuspended ? 'shadow-sm' : ''}`}
          >
            {/* Suspended Badge */}
            {transaction.isSuspended && (
              <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Pause className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">SUSPENDED</span>
                  <span className="text-xs text-yellow-600">
                    (Excluded from balance calculations)
                  </span>
                </div>
              </div>
            )}

            {/* Main Transaction Row */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => {
                toggleTransactionDetails(transaction.id);
                onTransactionClick?.(transaction);
              }}
            >
              <div className="flex items-center justify-between">
                {/* Left Section - Type Indicator and Details */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* Visual Indicator */}
                  <div className={`p-3 rounded-full ${indicator.bgColor} ${indicator.borderColor} border-2`}>
                    <div className={indicator.iconColor}>
                      {indicator.icon}
                    </div>
                  </div>

                  {/* Transaction Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${indicator.bgColor} ${indicator.iconColor}`}>
                        {transaction.type.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        {transaction.ledger?.name || 'No Ledger'}
                      </span>
                      {transaction.reference && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Ref: {transaction.reference}
                        </span>
                      )}
                      {/* Show description/remarks if available */}
                      {transaction.remarks && (
                        <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded flex items-center">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {transaction.remarks}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section - Amount and Impact */}
                <div className="flex items-center space-x-6">
                  {/* Amount Display - Move to left side for combined transactions */}
                  <div className={transaction.transactionType === 'combined' ? 'order-first' : 'text-right'}>
                      <div className={`text-xl font-bold flex items-center ${transaction.transactionType === 'combined' ? 'justify-start' : 'justify-end'} ${transaction.transactionType === 'combined' ? 'text-blue-600' : indicator.iconColor}`}>
                        <span className={transaction.transactionType === 'combined' ? 'text-2xl' : ''}>
                          {formatCurrency(amount)}
                        </span>
                        {transaction.transactionType === 'combined' && <span className="ml-2 text-blue-600 font-bold text-lg">+A</span>}
                      </div>
                    {showBalanceImpact && (
                      <div className="mt-1">
                        {getBalanceImpactDisplay(transaction)}
                      </div>
                    )}
                  </div>

                  {/* Running Balance (if available) */}
                  {transaction.runningBalance !== undefined && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Balance</div>
                      <div className={`text-lg font-semibold ${
                        transaction.runningBalance > 0 ? 'text-green-600' : 
                        transaction.runningBalance < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency(transaction.runningBalance)}
                      </div>
                    </div>
                  )}

                  {/* Expand/Collapse Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors duration-200"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200 bg-white bg-opacity-50"
                >
                  <div className="p-4 space-y-4">
                    {/* Transaction Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Date & Time */}
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Date & Time</div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(transaction.date), 'EEEE, MMMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(transaction.date), 'HH:mm:ss')}
                          </div>
                        </div>
                      </div>

                      {/* Created By */}
                      {transaction.createdBy && (
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Created By</div>
                            <div className="text-sm text-gray-600">{transaction.createdBy}</div>
                          </div>
                        </div>
                      )}

                      {/* Reference */}
                      {transaction.reference && (
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Reference</div>
                            <div className="text-sm text-gray-600">{transaction.reference}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description/Remarks */}
                    {transaction.remarks && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Remarks
                        </h5>
                        <p className="text-sm text-blue-800">
                          {transaction.remarks}
                        </p>
                      </div>
                    )}

                    {/* Balance Impact Details */}
                    {showBalanceImpact && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Balance Impact Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Transaction Type:</span>
                            <span className={`ml-2 font-medium ${indicator.iconColor}`}>
                              {indicator.label}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Amount:</span>
                            <span className={`ml-2 font-medium ${indicator.iconColor}`}>
                              {indicator.symbol}{formatCurrency(amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Balance Effect:</span>
                            <span className="ml-2 font-medium">
                              {transaction.type === 'anamath' ? 'No Effect' : getBalanceImpactDisplay(transaction)}
                            </span>
                          </div>
                        </div>
                        
                        {transaction.type === 'anamath' && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-amber-800">
                                <p className="font-medium">Anamath Entry</p>
                                <p>This transaction is recorded for audit purposes and does not affect the running balance calculations.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suspend Controls */}
                    {(onSuspendTransaction || onUnsuspendTransaction) && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Transaction Controls</h5>
                        
                        <div className="space-y-3">
                          {/* Reason Input */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Reason (Optional)
                            </label>
                            <input
                              type="text"
                              value={suspendReason}
                              onChange={(e) => setSuspendReason(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                              placeholder="Enter reason for action..."
                            />
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            {!transaction.isSuspended ? (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSuspendAction(transaction.id, false)}
                                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors duration-200"
                              >
                                <Pause className="w-4 h-4" />
                                <span>Suspend Transaction</span>
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSuspendAction(transaction.id, true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                              >
                                <Play className="w-4 h-4" />
                                <span>Unsuspend Transaction</span>
                              </motion.button>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600">
                            {transaction.isSuspended ? 
                              'Unsuspending will include this transaction in balance calculations.' :
                              'Suspending will exclude this transaction from balance calculations.'
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">There are no transactions to display with the current filters.</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedTransactionList;