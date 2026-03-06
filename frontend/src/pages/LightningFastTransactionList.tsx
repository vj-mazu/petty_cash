import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Filter,
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

interface Ledger {
  id: string;
  name: string;
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

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Ultra-fast API service
class UltraFastAPI {
  private static baseURL = '/api/ultra-fast';

  static async fetchTransactions(params: any) {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(params);

    const response = await fetch(`${this.baseURL}/transactions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async fetchSummary(params: any = {}) {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(params);

    const response = await fetch(`${this.baseURL}/summary?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }

  static async searchTransactions(query: string) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${this.baseURL}/search?query=${encodeURIComponent(query)}&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }

  static async fetchLedgers() {
    const token = localStorage.getItem('token');

    const response = await fetch(`${this.baseURL}/ledgers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }
}

// Lightning-fast transaction row component
const TransactionRow = React.memo<{ transaction: Transaction; index: number }>(({ transaction, index }) => {
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
    <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
      </div>
    </div>
  );
});

// Fast summary cards component
const SummaryCards = React.memo<{ summary: SummaryData | null; loading: boolean }>(({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
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
    },
    {
      title: 'Anamath Entries',
      value: formatNumber(summary.total_anamath),
      icon: Activity,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={card.title}
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
        </div>
      ))}
    </div>
  );
});

// Lightning Fast Transaction List Component
const LightningFastTransactionList: React.FC = () => {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLedger, setSelectedLedger] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Ledgers for filter
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  // Performance state
  const [lastResponseTime, setLastResponseTime] = useState(0);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchTransactions(1, true);
    fetchSummary();
    loadLedgers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return;
    setPage(1);
    setTransactions([]);
    fetchTransactions(1, true);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  useEffect(() => {
    setPage(1);
    setTransactions([]);
    fetchTransactions(1, true);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLedger, selectedType, dateRange]);



  // Load ledgers for filter
  const loadLedgers = async () => {
    try {
      const response = await UltraFastAPI.fetchLedgers();
      if (response.success) {
        setLedgers(response.data);
      }
    } catch (error) {
      console.error('Failed to load ledgers:', error);
    }
  };



  // Fetch transactions with optimized parameters
  const fetchTransactions = async (pageNum: number = 1, reset: boolean = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page: pageNum,
        limit: 50, // Fast loading with small chunks
      };

      // Add filters only if they have values
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (selectedLedger) params.ledgerId = selectedLedger;
      if (selectedType) params.type = selectedType;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await UltraFastAPI.fetchTransactions(params);

      if (response.success) {
        const newTransactions = response.data;

        if (reset || pageNum === 1) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }

        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.pagination.totalRecords);
        setHasMore(response.pagination.hasNextPage);
        setPage(pageNum);
        setLastResponseTime(response.performance.responseTime);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setError(error.message);
        console.error('Error fetching transactions:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    setSummaryLoading(true);

    try {
      const params: any = {};
      if (selectedLedger) params.ledgerId = selectedLedger;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await UltraFastAPI.fetchSummary(params);

      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Load more transactions
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchTransactions(page + 1, false);
    }
  }, [hasMore, loading, page]);

  // Refresh all data
  const refresh = useCallback(() => {
    setPage(1);
    setTransactions([]);
    fetchTransactions(1, true);
    fetchSummary();
  }, []);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLedger('');
    setSelectedType('');
    setDateRange({ start: '', end: '' });
  };

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
      {/* Header with Performance Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lightning Fast Transactions ⚡
          </h1>
          <p className="text-gray-600 mt-1">
            Optimized for 20,000+ records • Last query: {lastResponseTime}ms
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {formatNumber(totalRecords)} Total Records
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={summaryLoading} />

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions... (real-time)"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={clearFilters}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            Clear
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ledger</label>
              <select
                value={selectedLedger}
                onChange={(e) => setSelectedLedger(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Ledgers</option>
                {ledgers.map(ledger => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions ({formatNumber(transactions.length)} of {formatNumber(totalRecords)})
            </h2>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Page {page} of {totalPages}</span>
              {loading && <Loader className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        </div>

        {/* Transaction Rows */}
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {transactions.map((transaction, index) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              index={index}
            />
          ))}

          {transactions.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 text-center border-t border-gray-200">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin inline mr-2" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}

        {/* End indicator */}
        {!hasMore && transactions.length > 0 && (
          <div className="p-4 text-center text-gray-500 border-t border-gray-200">
            <p>All transactions loaded • Total: {formatNumber(totalRecords)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LightningFastTransactionList;