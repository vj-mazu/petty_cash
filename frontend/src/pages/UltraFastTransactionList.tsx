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

// Ultra-fast custom virtual scrolling component
const CustomVirtualList = memo<{
  items: Transaction[];
  itemHeight: number;
  containerHeight: number;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}>(({ items, itemHeight, containerHeight, onLoadMore, hasMore, loading }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 2,
    items.length
  );
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    
    // Load more when near bottom
    const { scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 200 && hasMore && !loading) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loading]);
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const offsetY = visibleStart * itemHeight;
  const totalHeight = items.length * itemHeight;
  
  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      className="border-t border-gray-200"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((transaction, index) => (
            <TransactionRowFast
              key={transaction.id}
              transaction={transaction}
              style={{ height: itemHeight }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// Ultra-optimized transaction row
const TransactionRowFast = memo<{ transaction: Transaction; style: any }>(({ transaction, style }) => {
  const transactionType = transaction.creditAmount > 0 ? 'credit' : 'debit';
  const amount = transaction.creditAmount > 0 ? transaction.creditAmount : transaction.debitAmount;
  
  return (
    <div style={style} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex items-center space-x-3 flex-1">
        <div className={`p-1.5 rounded ${
          transactionType === 'credit' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
        }`}>
          {transactionType === 'credit' ? 
            <TrendingUp className="w-3.5 h-3.5" /> : 
            <TrendingDown className="w-3.5 h-3.5" />
          }
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {transaction.ledger?.name || 'Unknown'}
            </h3>
            <span className="text-xs text-gray-500">
              #{transaction.transaction_number || transaction.id.slice(0, 6)}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 truncate">
            {transaction.description || transaction.remarks || 'No description'}
          </p>
          
          <span className="text-xs text-gray-400">
            {formatDate(transaction.date)}
          </span>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`text-sm font-semibold ${
          transactionType === 'credit' ? 'text-green-600' : 'text-red-600'
        }`}>
          {transactionType === 'credit' ? '+' : '-'}{formatCurrency(amount)}
        </div>
      </div>
    </div>
  );
});

// Optimized transaction row for virtual scrolling - REMOVE THIS OLD VERSION
const TransactionRow = memo<{ index: number; style: any; data: Transaction[] }>(({ index, style, data }) => {
  const transaction = data[index];
  
  if (!transaction) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <Loader className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  const transactionType = transaction.creditAmount > 0 ? 'credit' : 'debit';
  const amount = transaction.creditAmount > 0 ? transaction.creditAmount : transaction.debitAmount;
  
  return (
    <div style={style} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex items-center space-x-4 flex-1">
        <div className={`p-2 rounded-lg ${
          transactionType === 'credit' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
        }`}>
          {transactionType === 'credit' ? 
            <TrendingUp className="w-4 h-4" /> : 
            <TrendingDown className="w-4 h-4" />
          }
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
        <div className={`text-lg font-semibold ${
          transactionType === 'credit' ? 'text-green-600' : 'text-red-600'
        }`}>
          {transactionType === 'credit' ? '+' : '-'}{formatCurrency(amount)}
        </div>
      </div>
    </div>
  );
});

// Summary cards component
const SummaryCards = memo<{ summary: SummaryData | null; loading: boolean }>(({ summary, loading }) => {
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

// Main ultra-fast transaction list component
const UltraFastTransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    
    const startTime = Date.now();
    
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '100', // Increased limit for better performance
        search: search,
        sortBy: 'date',
        sortOrder: 'DESC'
      });

      // Use regular transactions endpoint which already exists
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
        if (append) {
          setTransactions(prev => [...prev, ...(data.data || data.transactions || [])]);
        } else {
          setTransactions(data.data || data.transactions || []);
        }
        
        // Handle different API response formats
        const total = data.total || data.pagination?.totalRecords || data.count || 0;
        const limit = parseInt(queryParams.get('limit') || '100');
        const totalPages = Math.ceil(total / limit);
        
        setTotalPages(totalPages);
        setTotalRecords(total);
        setHasNextPage(pageNum < totalPages);
        setPage(pageNum);
      } else {
        throw new Error(data.message || 'Failed to fetch transactions');
      }
      
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      
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

  // Load more for infinite scroll
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
  }, []);

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ultra-Fast Transactions
          </h1>
          <p className="text-gray-600 mt-1">
            Optimized for 2-second loading of large datasets
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Response: {responseTime}ms
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

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
              <span>Showing {transactions.length} of {formatNumber(totalRecords)}</span>
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
            {/* Virtual scrolling list */}
            <div style={{ height: '600px' }}>
              <CustomVirtualList
                items={transactions}
                itemHeight={100}
                containerHeight={600}
                onLoadMore={loadMore}
                hasMore={hasNextPage}
                loading={loading}
              />
            </div>
            
            {/* Load More Button */}
            {hasNextPage && (
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
            {!hasNextPage && transactions.length > 0 && (
              <div className="p-4 text-center text-gray-500 border-t border-gray-200">
                <p>All {formatNumber(totalRecords)} transactions loaded</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UltraFastTransactionList;