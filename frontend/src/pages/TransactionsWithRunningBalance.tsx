import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ToggleLeft,
  ToggleRight,
  List,
  Calculator,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { transactionApi, ledgerApi, openingBalanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { RunningBalanceDisplay } from '../components/transactions';

interface Transaction {
  id: string;
  date: string;
  time?: string;
  remarks?: string;
  creditAmount: number;
  debitAmount: number;
  type: 'credit' | 'debit' | 'anamath';
  ledger?: {
    id: string;
    name: string;
  };
  reference?: string;
  isAnamath?: boolean;
}

const TransactionsWithRunningBalance: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [useRunningBalanceView, setUseRunningBalanceView] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch opening balance
  const fetchOpeningBalance = useCallback(async () => {
    // Check if user has opening balance access (admin only)
    const hasOpeningBalanceAccess = user?.role === 'admin';

    if (!hasOpeningBalanceAccess) {
      // Use fallback value for staff users
      setOpeningBalance(0);
      return;
    }

    try {
      const response = await openingBalanceApi.getSummary();
      if (response.success && response.data) {
        setOpeningBalance(response.data.totalOpeningBalance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch opening balance:', error);
      // Use fallback value
      setOpeningBalance(0);
    }
  }, [user?.role]);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 50, // Increased limit for better running balance calculation
      };

      const response = await transactionApi.getAll(params);

      if (response.success) {
        // Process transactions data
        let transactionsData: any[] = [];

        if (Array.isArray(response.data)) {
          transactionsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if ('data' in response.data && Array.isArray(response.data.data)) {
            transactionsData = response.data.data;
          } else if ('transactions' in response.data && Array.isArray(response.data.transactions)) {
            transactionsData = response.data.transactions;
          }
        }

        // Transform transactions to include proper type and amounts
        const transformedTransactions: Transaction[] = transactionsData.map(transaction => {
          const creditAmount = parseFloat(transaction.creditAmount) || 0;
          const debitAmount = parseFloat(transaction.debitAmount) || 0;

          // Determine transaction type
          let type: 'credit' | 'debit' | 'anamath' = 'credit';
          if (transaction.isAnamath || transaction.type === 'anamath') {
            type = 'anamath';
          } else if (debitAmount > 0) {
            type = 'debit';
          }

          return {
            id: transaction.id || transaction._id,
            date: transaction.date || transaction.createdAt,
            remarks: transaction.remarks || '',
            creditAmount,
            debitAmount,
            balance: 0, // Will be calculated by RunningBalanceDisplay
            type,
            ledger: transaction.ledger,
            reference: transaction.reference,
            isAnamath: transaction.isAnamath || transaction.type === 'anamath'
          };
        });

        // Sort transactions by date (newest first for display, but RunningBalanceDisplay will handle calculation order)
        const sortedTransactions = transformedTransactions.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setTransactions(sortedTransactions);

        // Set pagination info
        if (response.data && typeof response.data === 'object' && 'pagination' in response.data) {
          const pagination = response.data.pagination as any;
          setTotalPages(pagination?.pages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchOpeningBalance(), fetchTransactions()]);
    };

    loadData();
  }, [fetchOpeningBalance, fetchTransactions]);

  const handleTransactionClick = (transaction: Transaction) => {
    // Navigate to transaction details or edit page
    navigate(`/transactions/${transaction.id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Loading transactions with running balance..." />;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-800 text-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/transactions')}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Enhanced Transaction View</h1>
              <p className="text-indigo-100 mt-1">Running balance and visual indicators</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* View Toggle */}
            <div className="flex items-center space-x-3 bg-white bg-opacity-10 rounded-lg p-2">
              <List className="w-4 h-4" />
              <span className="text-sm">List View</span>
              <button
                onClick={() => setUseRunningBalanceView(!useRunningBalanceView)}
                className="flex items-center"
              >
                {useRunningBalanceView ? (
                  <ToggleRight className="w-6 h-6 text-green-300" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-300" />
                )}
              </button>
              <span className="text-sm">Running Balance</span>
              <Calculator className="w-4 h-4" />
            </div>

            {/* Add Transaction Button */}
            <button
              onClick={() => navigate('/transactions/create')}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${useRunningBalanceView ? 'bg-green-100' : 'bg-gray-100'}`}>
              {useRunningBalanceView ? (
                <Calculator className="w-5 h-5 text-green-600" />
              ) : (
                <List className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {useRunningBalanceView ? 'Running Balance View Active' : 'Standard List View Active'}
              </p>
              <p className="text-sm text-gray-600">
                {useRunningBalanceView
                  ? 'Showing running balance calculations with visual indicators'
                  : 'Switch to running balance view for enhanced transaction analysis'
                }
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-xl font-bold text-gray-900">{transactions.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Transaction Display */}
      {useRunningBalanceView ? (
        <RunningBalanceDisplay
          transactions={transactions}
          openingBalance={openingBalance}
          onTransactionClick={handleTransactionClick}
          showFilters={true}
          className="mt-6"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-6 text-center bg-gray-50"
        >
          <List className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Standard List View</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Enable running balance view to see enhanced transaction display with balance calculations
          </p>
          <button
            onClick={() => setUseRunningBalanceView(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Enable Running Balance View
          </button>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md transition-colors ${currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {page}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-8 text-center bg-gray-50"
        >
          <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600 mb-4">
            Create your first transaction to see the running balance display in action
          </p>
          <button
            onClick={() => navigate('/transactions/create')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create First Transaction
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TransactionsWithRunningBalance;