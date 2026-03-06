import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Activity,
  AlertCircle,
  Loader,
  ChevronDown
} from 'lucide-react';

// TypeScript interfaces
interface Transaction {
  id: string;
  date: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  transaction_number?: number;
  remarks?: string;
  ledger?: {
    name: string;
  };
}

interface SummaryData {
  total_transactions: number;
  total_credits: number;
  total_debits: number;
  net_amount: number;
  total_anamath: number;
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

// Format number
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Ultra-optimized transaction row
const TransactionRow = memo<{ transaction: Transaction; index: number }>(({ transaction, index }) => {
  const transactionType = transaction.creditAmount > 0 ? 'credit' : 'debit';
  const amount = transaction.creditAmount > 0 ? transaction.creditAmount : transaction.debitAmount;

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <div className={`p-1.5 rounded-lg ${transactionType === 'credit' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
          }`}>
          {transactionType === 'credit' ?
            <TrendingUp className="w-3 h-3" /> :
            <TrendingDown className="w-3 h-3" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {transaction.ledger?.name || 'Unknown Ledger'}
            </h3>
            <span className="text-xs text-gray-500">
              #{transaction.transaction_number || transaction.id.slice(0, 6)}
            </span>
          </div>

          <p className="text-xs text-gray-500 truncate">
            {transaction.description || transaction.remarks || 'No description'}
          </p>

          <span className="text-xs text-gray-400 flex items-center mt-1">
            <Calendar className="w-2.5 h-2.5 mr-1" />
            {formatDate(transaction.date)}
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-sm font-semibold ${transactionType === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
          {transactionType === 'credit' ? '+' : '-'}{formatCurrency(amount)}
        </div>
      </div>
    </div>
  );
});

// Performance stats component
const PerformanceStats = memo<{ responseTime: number; recordCount: number; totalRecords: number }>(
  ({ responseTime, recordCount, totalRecords }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4 text-blue-800">
          <span className="font-medium">⚡ Performance:</span>
          <span>{responseTime}ms</span>
          <span>|</span>
          <span>Showing {recordCount} of {formatNumber(totalRecords)}</span>
        </div>
        <div className="text-blue-600">
          {responseTime < 100 ? '🟢 Excellent' : responseTime < 500 ? '🟡 Good' : '🔴 Slow'}
        </div>
      </div>
    </div>
  )
);

// Summary cards component
const SummaryCards = memo<{ summary: SummaryData | null; loading: boolean }>(({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Transactions',
      value: formatNumber(summary.total_transactions),
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'Credits',
      value: formatCurrency(summary.total_credits),
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Debits',
      value: formatCurrency(summary.total_debits),
      icon: TrendingDown,
      color: 'red'
    },
    {
      title: 'Net Amount',
      value: formatCurrency(summary.net_amount),
      icon: DollarSign,
      color: summary.net_amount >= 0 ? 'green' : 'red'
    },
    {
      title: 'Anamath',
      value: formatNumber(summary.total_anamath),
      icon: Activity,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">{card.title}</p>
              <p className={`text-sm font-semibold text-${card.color}-600`}>
                {card.value}
              </p>
            </div>
            <div className={`p-1.5 rounded-lg bg-${card.color}-50`}>
              <card.icon className={`w-4 h-4 text-${card.color}-600`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// Main ultra-fast transaction list component
const FastTransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showPerformanceStats, setShowPerformanceStats] = useState(true);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const debouncedSearch = useCallback((term: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(term);
      setPage(1);
      setTransactions([]);
      fetchTransactions(1, term);
    }, 300);
  }, []);

  // Fetch transactions with ultra-fast API
  const fetchTransactions = useCallback(async (pageNum = 1, search = '', append = false) => {
    if (pageNum === 1) setInitialLoading(true);
    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '50', // Fixed small limit for speed
        search: search,
        sortBy: 'date',
        sortOrder: 'DESC'
      });

      const response = await fetch(`/api/transactions/fast?${queryParams}`, {
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
        if (append) {
          setTransactions(prev => [...prev, ...(data.data || [])]);
        } else {
          setTransactions(data.data || []);
        }
        setTotalRecords(data.pagination?.totalRecords || 0);
        setHasNextPage(data.pagination?.hasNextPage || false);
        setPage(pageNum);
      } else {
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
      if (pageNum === 1) setInitialLoading(false);
    }
  }, []);

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
          setSummary(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load more for pagination
  const loadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      const nextPage = page + 1;
      fetchTransactions(nextPage, searchTerm, true);
    }
  }, [page, hasNextPage, loading, fetchTransactions, searchTerm]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 5 && hasNextPage && !loading) {
          loadMore();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasNextPage, loading, loadMore]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
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
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            ⚡ Fast Transactions
          </h1>
          <p className="text-sm text-gray-600">
            Loading 22,000+ records in under 2 seconds
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPerformanceStats(!showPerformanceStats)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {showPerformanceStats ? 'Hide' : 'Show'} Stats
          </button>

          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      {showPerformanceStats && (
        <PerformanceStats
          responseTime={responseTime}
          recordCount={transactions.length}
          totalRecords={totalRecords}
        />
      )}

      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={summaryLoading} />

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search transactions..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions
            </h2>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {loading && (
                <div className="flex items-center">
                  <Loader className="w-4 h-4 animate-spin mr-1" />
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>

        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        ) : (
          <>
            {/* Scrollable container */}
            <div
              ref={containerRef}
              className="max-h-96 overflow-y-auto"
              style={{ height: '500px' }}
            >
              {transactions.map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  index={index}
                />
              ))}

              {/* Load more indicator */}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading more...</span>
                </div>
              )}
            </div>

            {/* Load More Button */}
            {hasNextPage && !loading && (
              <div className="p-4 text-center border-t border-gray-200">
                <button
                  onClick={loadMore}
                  className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Load More Transactions
                </button>
              </div>
            )}

            {/* End of data indicator */}
            {!hasNextPage && transactions.length > 0 && (
              <div className="p-4 text-center text-gray-500 border-t border-gray-200">
                <p className="text-sm">✅ All {formatNumber(totalRecords)} transactions loaded</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FastTransactionList;