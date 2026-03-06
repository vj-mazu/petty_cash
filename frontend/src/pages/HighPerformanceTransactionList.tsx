import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// TypeScript interfaces
interface Transaction {
  id: string;
  date: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  ledgerId: string;
  transaction_number?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  ledger?: {
    name: string;
  };
}

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
}

interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  recordCount: number;
}

interface SummaryData {
  total_transactions: number;
  total_credits: number;
  total_debits: number;
  net_amount: number;
}

interface SummaryCardsProps {
  summary: SummaryData | null;
  loading: boolean;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date
const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(new Date(date));
};

// Format date and time
const formatDateTime = (date: string) => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Format number
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Memoized transaction row component for performance
const TransactionRow = memo<TransactionRowProps>(({ transaction, index }) => {
  // Determine transaction type based on amounts
  const transactionType = transaction.creditAmount > 0 ? 'credit' : 'debit';
  const amount = transaction.creditAmount > 0 ? transaction.creditAmount : transaction.debitAmount;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit': return 'text-green-600 bg-green-50';
      case 'debit': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit': return <TrendingUp className="w-4 h-4" />;
      case 'debit': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-4 flex-1">
        <div className={`p-2 rounded-lg ${getTypeColor(transactionType)}`}>
          {getTypeIcon(transactionType)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {transaction.ledger?.name || 'Unknown Ledger'}
            </h3>
            <span className="text-xs text-gray-500">
              #{transaction.transaction_number || transaction.id.slice(0, 8)}
            </span>
          </div>

          <p className="text-sm text-gray-500 truncate mt-1">
            {transaction.description || transaction.remarks || 'No description'}
          </p>

          <div className="flex items-center space-x-4 mt-2">
            <span className="text-xs text-gray-400 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(transaction.date)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-lg font-semibold ${transactionType === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
          {transactionType === 'credit' ? '+' : '-'}{formatCurrency(amount)}
        </div>

        <div className="text-xs text-gray-400 mt-1">
          {formatDateTime(transaction.createdAt)}
        </div>
      </div>
    </motion.div>
  );
});

// Performance monitoring component
const PerformanceMonitor = memo<PerformanceMonitorProps>(({ metrics, recordCount }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-blue-800 flex items-center">
          <Activity className="w-4 h-4 mr-2" />
          Performance Metrics
        </h4>

        <div className="flex items-center space-x-4 text-xs text-blue-600">
          <span>Render: {metrics.renderTime.toFixed(1)}ms</span>
          <span>API: {metrics.apiResponseTime.toFixed(1)}ms</span>
          <span>Records: {formatNumber(recordCount)}</span>
          {metrics.memoryUsage > 0 && (
            <span>Memory: {metrics.memoryUsage.toFixed(1)}MB</span>
          )}
        </div>
      </div>
    </div>
  );
});

// Summary cards component
const SummaryCards = memo<SummaryCardsProps>(({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Transactions',
      value: formatNumber(summary.total_transactions),
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'Total Credits',
      value: formatCurrency(summary.total_credits),
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Total Debits',
      value: formatCurrency(summary.total_debits),
      icon: TrendingDown,
      color: 'red'
    },
    {
      title: 'Net Amount',
      value: formatCurrency(summary.net_amount),
      icon: DollarSign,
      color: summary.net_amount >= 0 ? 'green' : 'red'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className={`text-xl font-semibold text-${card.color}-600`}>
                {card.value}
              </p>
            </div>
            <div className={`p-2 rounded-lg bg-${card.color}-50`}>
              <card.icon className={`w-6 h-6 text-${card.color}-600`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// Main high-performance transaction list component
const HighPerformanceTransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0
  });

  // Fetch transactions
  const fetchTransactions = useCallback(async (pageNum = 1, search = '', filters = {}) => {
    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: performanceMode ? '100' : '50',
        search: search,
        ...filters
      });

      const response = await fetch(`/api/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (pageNum === 1) {
          setTransactions(data.data || data.transactions || []);
        } else {
          setTransactions(prev => [...prev, ...(data.data || data.transactions || [])]);
        }
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / (performanceMode ? 100 : 50)));
        setTotalRecords(data.total || 0);
      } else {
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      const endTime = performance.now();
      setMetrics(prev => ({ ...prev, apiResponseTime: endTime - startTime }));

    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [performanceMode]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transactions/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummary(data.data || data);
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Search handler
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
    fetchTransactions(1, term);
  }, [fetchTransactions]);

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, searchTerm);
    }
  }, [page, totalPages, loading, fetchTransactions, searchTerm]);

  // Refresh data
  const refresh = useCallback(() => {
    setPage(1);
    setTransactions([]);
    fetchTransactions(1, searchTerm);
    fetchSummary();
  }, [fetchTransactions, fetchSummary, searchTerm]);

  // Initial load
  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [fetchTransactions, fetchSummary]);

  // Measure render performance
  useEffect(() => {
    const startTime = performance.now();
    const timeoutId = setTimeout(() => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [transactions]);

  // Monitor memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ((performance as any).memory) {
        const memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="font-medium text-red-800">Error Loading Transactions</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            High-Performance Transactions
          </h1>
          <p className="text-gray-600 mt-1">
            Optimized for handling large datasets efficiently
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={performanceMode}
              onChange={(e) => setPerformanceMode(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Performance Mode</span>
          </label>

          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Performance Monitor */}
      {performanceMode && (
        <PerformanceMonitor
          metrics={metrics}
          recordCount={totalRecords}
        />
      )}

      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={summaryLoading} />

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions ({formatNumber(totalRecords)})
            </h2>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Page {page} of {totalPages}</span>
              {loading && <LoadingSpinner />}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {transactions.map((transaction, index) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              index={index}
            />
          ))}
        </div>

        {/* Load More Button */}
        {page < totalPages && (
          <div className="p-4 text-center border-t border-gray-200">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* End of data indicator */}
        {page >= totalPages && transactions.length > 0 && (
          <div className="p-4 text-center text-gray-500 border-t border-gray-200">
            <p>No more transactions to load</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighPerformanceTransactionList;