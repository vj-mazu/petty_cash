import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { transactionApi, ledgerApi, type Transaction as ApiTransaction, type Ledger } from '../services/api';
import { Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

interface Transaction extends Omit<ApiTransaction, 'ledgerId' | 'balance'> {
  balance: number;
  ledger?: Ledger;
  ledgerId?: string;
  type: 'debit' | 'credit';
  debitAmount: number;
  creditAmount: number;
  reference?: string;
  date: string;
  id: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface Totals {
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLedger, setSelectedLedger] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totals, setTotals] = useState<Totals>({ 
    totalDebit: 0, 
    totalCredit: 0,
    balance: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  // Fetch ledgers from API
  const fetchLedgers = useCallback(async () => {
    try {
      const response = await ledgerApi.getAll({ limit: 100 });
      if (response.success) {
        setLedgers(response.data.ledgers);
      }
    } catch (error) {
      console.error('Failed to fetch ledgers:', error);
      toast.error('Failed to load ledgers');
    }
  }, []);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        ledgerId: selectedLedger === 'all' ? undefined : selectedLedger,
        type: selectedType === 'all' ? undefined : selectedType as 'debit' | 'credit',
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const [transactionsResponse, summaryResponse] = await Promise.all([
        transactionApi.getAll(params),
        ledgerApi.getSummary()
      ]);

      if (transactionsResponse.success && summaryResponse.success) {
        const summary = summaryResponse.data?.summary || {};
        
        // Process transactions data
        const transactionsData = Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : transactionsResponse.data?.data || [];
        
        // Calculate running balance
        const calculateRunningBalance = (transactions: any[]): Transaction[] => {
          let runningBalance = summary.totalBalance || 0;
          
          // Sort transactions by date in ascending order
          const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
          );
          
          return sortedTransactions.map(transaction => {
            const creditAmount = transaction.creditAmount || (transaction.type === 'credit' ? transaction.amount : 0);
            const debitAmount = transaction.debitAmount || (transaction.type === 'debit' ? transaction.amount : 0);
            
            runningBalance += (creditAmount || 0) - (debitAmount || 0);
            
            return {
              ...transaction,
              id: transaction.id || transaction._id,
              creditAmount,
              debitAmount,
              balance: runningBalance,
              date: transaction.date || transaction.createdAt,
              type: transaction.type || (debitAmount > 0 ? 'debit' : 'credit')
            } as Transaction;
          });
        };
        
        const transactionsWithBalance = calculateRunningBalance(transactionsData);
        
        setTransactions(transactionsWithBalance);
        setTotalPages(transactionsResponse.data.pagination?.pages || 1);
        
        // Update totals
        setTotals({
          totalDebit: summary.totalDebits || 0,
          totalCredit: summary.totalCredits || 0,
          balance: summary.totalBalance || 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedLedger, selectedType, startDate, endDate]);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchLedgers(), fetchTransactions()]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [fetchLedgers, fetchTransactions]);

  // Handle transaction deletion
  const handleDelete = async (id: string) => {
    if (!id) return;
    
    try {
      const response = await transactionApi.delete(id);
      if (response.success) {
        toast.success('Transaction deleted successfully');
        await fetchTransactions();
        setShowDeleteModal(null);
      } else {
        throw new Error(response.message || 'Failed to delete transaction');
      }
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLedger('all');
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Permissions - currently all users have full access
  const canDelete = true;

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Loading transactions..." />;
  }

  // Group transactions by date
  const transactionsByDate = transactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
    const date = format(new Date(transaction.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {});

  if (transactions.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <p className="text-gray-500">No transactions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Transaction Records</h1>
            <p className="text-blue-100 mt-1">View and manage all financial transactions</p>
          </div>
        </div>
      </div>

      {/* Add your transaction list rendering logic here */}
      
    </div>
  );
};

export default Transactions;
