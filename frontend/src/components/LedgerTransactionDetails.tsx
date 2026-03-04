import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  User,
  Building2,
  AlertTriangle,
  Eye,
  Pause,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { transactionApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'react-toastify';

interface Transaction {
  id: string;
  date: string;
  description?: string;
  remarks?: string;
  creditAmount: number;
  debitAmount: number;
  reference?: string;
  transactionType?: 'regular' | 'combined' | 'anamath';
  isSuspended?: boolean;
  suspendedAt?: string;
  runningBalance?: number;
  creator?: {
    id: string;
    username: string;
  };
  displayTransactionNumber?: string;
  transactionNumber?: number;
}

interface LedgerTransactionDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerId: string;
  ledgerName: string;
  showSuspendButton?: boolean; // New prop to control suspend button visibility
}

const LedgerTransactionDetails: React.FC<LedgerTransactionDetailsProps> = ({
  isOpen,
  onClose,
  ledgerId,
  ledgerName,
  showSuspendButton = false // Default to false (hidden) for ledger view
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = async (pageNum = 1, loadAll = false) => {
    setLoading(true);
    setSelectedTransaction(null); // Clear selected transaction when changing view
    console.log(`🔍 Fetching transactions: pageNum=${pageNum}, loadAll=${loadAll}, limit=${loadAll ? 10000 : 20}`);

    try {
      const response = await transactionApi.getAll({
        page: pageNum,
        limit: loadAll ? 10000 : 20, // Using a reasonable limit to avoid validation errors
        ledgerId: ledgerId,
        includeSuspended: 'true' // Always include suspended transactions in ledger view
      });

      console.log(`✅ Response received:`, response);
      console.log(`📊 Transactions count:`, response.data?.transactions?.length || 0);

      if (response.success && response.data) {
        setTransactions(response.data.transactions || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalRecords(response.data.pagination?.total || response.data.transactions?.length || 0);
        setPage(pageNum);
        setShowAll(loadAll);
        console.log(`✅ Transactions set successfully: ${response.data.transactions?.length || 0} records`);

        // Show success message when loading all records
        if (loadAll && response.data.transactions?.length > 0) {
          toast.success(`Loaded all ${response.data.transactions.length} transactions`);
        }
      } else {
        console.error('❌ Response not successful:', response);
        toast.error('Failed to load transactions');
      }
    } catch (error: any) {
      console.error('❌ Error fetching transactions:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ledgerId) {
      // Reset to paginated view when opening
      setShowAll(false);
      fetchTransactions(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ledgerId]);

  const handleSuspendTransaction = async (transactionId: string, reason: string = '') => {
    try {
      await transactionApi.suspend(transactionId, reason);
      toast.success('Transaction suspended successfully');
      fetchTransactions(page); // Refresh current page
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suspend transaction');
    }
  };

  const handleUnsuspendTransaction = async (transactionId: string, reason: string = '') => {
    try {
      await transactionApi.unsuspend(transactionId, reason);
      toast.success('Transaction unsuspended successfully');
      fetchTransactions(page); // Refresh current page
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unsuspend transaction');
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.transactionType === 'combined') {
      return <AlertTriangle className="w-5 h-5 text-blue-600" />;
    } else if (transaction.creditAmount > 0) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
  };

  const getTransactionAmount = (transaction: Transaction) => {
    return transaction.creditAmount > 0 ? transaction.creditAmount : transaction.debitAmount;
  };

  const getTransactionType = (transaction: Transaction) => {
    if (transaction.transactionType === 'combined') return 'Combined';
    return transaction.creditAmount > 0 ? 'Credit' : 'Debit';
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.isSuspended) return 'text-gray-500';
    if (transaction.transactionType === 'combined') return 'text-blue-600';
    return transaction.creditAmount > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        style={{ margin: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <div>
                  <h2 className="text-lg font-bold">{ledgerName}</h2>
                  <p className="text-blue-100 text-xs">
                    {showAll
                      ? `Showing all ${transactions.length} transactions`
                      : `Page ${page} • Showing ${transactions.length} of ${totalRecords} transactions`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!showAll && totalRecords > 20 && (
                  <button
                    onClick={() => fetchTransactions(1, true)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium shadow-md disabled:opacity-50"
                  >
                    Show All
                  </button>
                )}
                {showAll && (
                  <button
                    onClick={() => fetchTransactions(1, false)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    Back to Paginated View
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {loading ? (
              <LoadingSpinner message="Loading transactions..." />
            ) : (
              <>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transactions Found</h3>
                    <p className="text-gray-500">This ledger doesn't have any transactions yet.</p>
                  </div>
                ) : (
                  <div className={`overflow-x-auto ${showAll ? 'overflow-y-auto' : ''}`} style={showAll ? { maxHeight: 'calc(90vh - 200px)' } : {}}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border border-gray-400 px-1.5 py-1 text-center w-14 bg-indigo-100 font-bold text-xs">TX #</th>
                          <th className="border border-gray-400 px-1.5 py-1 text-center w-24 bg-blue-100 font-bold text-xs">DATE</th>
                          <th className="border border-gray-400 px-1.5 py-1 text-center w-20 bg-blue-100 font-bold text-xs">TYPE</th>
                          <th className="border border-gray-400 px-1.5 py-1 text-center bg-green-100 font-bold text-xs">AMOUNT</th>
                          <th className="border border-gray-400 px-1.5 py-1 text-center bg-blue-50 font-bold text-xs">REMARKS</th>
                          <th className="border border-gray-400 px-1.5 py-1 text-center w-20 bg-orange-100 font-bold text-xs">STATUS</th>
                          <th className="border border-gray-400 px-1.5 py-1 text-center w-20 bg-gray-200 font-bold text-xs">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction, index) => (
                          <tr
                            key={transaction.id}
                            className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${transaction.isSuspended ? 'opacity-70' : ''
                              }`}
                          >
                            <td className="border border-gray-300 px-1.5 py-1 text-center text-xs font-medium font-mono">
                              {transaction.displayTransactionNumber
                                || (transaction.transactionNumber ? `T${String(transaction.transactionNumber).padStart(2, '0')}` : '-')}
                            </td>
                            <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                              {format(new Date(transaction.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${transaction.isSuspended ? 'bg-gray-100 text-gray-600' :
                                transaction.transactionType === 'combined' ? 'bg-blue-100 text-blue-800' :
                                  transaction.creditAmount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {transaction.isSuspended ? 'SUS' : getTransactionType(transaction) === 'Credit' ? 'CR' : getTransactionType(transaction) === 'Debit' ? 'DR' : 'CMB'}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-1.5 py-1 text-center text-xs font-medium">
                              <span className={getTransactionColor(transaction)}>
                                {formatCurrency(getTransactionAmount(transaction))}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-1.5 py-1 text-center text-xs min-w-[80px]">
                              {transaction.remarks || '-'}
                            </td>
                            <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                              {transaction.isSuspended ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700">
                                  Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="border border-gray-300 px-1.5 py-1 text-center">
                              <div className="flex justify-center items-center space-x-1">
                                {showSuspendButton && (
                                  <>
                                    {transaction.isSuspended ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleUnsuspendTransaction(transaction.id); }}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                        title="Unsuspend"
                                      >
                                        <Play className="w-3 h-3" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleSuspendTransaction(transaction.id); }}
                                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                        title="Suspend"
                                      >
                                        <Pause className="w-3 h-3" />
                                      </button>
                                    )}
                                  </>
                                )}
                                <button
                                  onClick={() => setSelectedTransaction(
                                    selectedTransaction?.id === transaction.id ? null : transaction
                                  )}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="View details"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Selected Transaction Details */}
                    <AnimatePresence>
                      {selectedTransaction && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 p-4 bg-gray-50 rounded-lg border"
                        >
                          <h4 className="font-semibold text-gray-800 mb-3">Transaction Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Date:</span>
                                <span>{format(new Date(selectedTransaction.date), 'PPPp')}</span>
                              </div>

                              {selectedTransaction.reference && (
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">Reference:</span>
                                  <span>{selectedTransaction.reference}</span>
                                </div>
                              )}

                              {selectedTransaction.creator && (
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">Created by:</span>
                                  <span>{selectedTransaction.creator.username}</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Transaction Type:</span>
                                <span className="capitalize">{selectedTransaction.transactionType || 'regular'}</span>
                              </div>

                              {selectedTransaction.isSuspended && selectedTransaction.suspendedAt && (
                                <div className="flex items-center space-x-2">
                                  <Pause className="w-4 h-4 text-yellow-600" />
                                  <span className="font-medium">Suspended:</span>
                                  <span>{format(new Date(selectedTransaction.suspendedAt), 'PPP')}</span>
                                </div>
                              )}

                              {selectedTransaction.remarks && (
                                <div className="flex items-start space-x-2">
                                  <span className="font-medium">Full Remarks:</span>
                                  <span className="break-words">{selectedTransaction.remarks}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pagination */}
                    {!showAll && totalPages > 1 && (
                      <div className="flex flex-col items-center space-y-3 mt-6">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => fetchTransactions(page - 1)}
                            disabled={page <= 1 || loading}
                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded-md text-sm transition-colors font-medium"
                          >
                            ← Previous
                          </button>

                          <span className="px-6 py-2 text-sm text-gray-700 font-medium bg-gray-100 rounded-md">
                            Page {page} of {totalPages}
                          </span>

                          <button
                            onClick={() => fetchTransactions(page + 1)}
                            disabled={page >= totalPages || loading}
                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded-md text-sm transition-colors font-medium"
                          >
                            Next →
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Viewing {((page - 1) * 20) + 1} - {Math.min(page * 20, totalRecords)} of {totalRecords} records
                        </p>
                      </div>
                    )}

                    {/* Show All Records mode indicator */}
                    {showAll && transactions.length > 0 && (
                      <div className="flex justify-center mt-6">
                        <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                          <Eye className="w-4 h-4 mr-2" />
                          Displaying all {transactions.length} records • No pagination
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LedgerTransactionDetails;