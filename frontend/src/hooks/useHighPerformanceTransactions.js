import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

// Custom hook for high-performance transaction fetching
export const useHighPerformanceTransactions = (initialFilters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_records: 0,
    per_page: 50,
    has_next: false,
    has_prev: false
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    sort_by: 'transaction_date',
    sort_order: 'DESC',
    include_balance: false,
    ...initialFilters
  });

  // Debounced API call to prevent excessive requests
  const debouncedFetchTransactions = useCallback(
    debounce(async (filterParams) => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams();
        
        // Add all filter parameters
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            queryParams.append(key, value);
          }
        });
        
        const response = await fetch(`/api/hp/transactions?${queryParams}`, {
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
          if (filterParams.page === 1) {
            // First page - replace data
            setTransactions(data.data.transactions);
          } else {
            // Subsequent pages - append data for infinite scroll
            setTransactions(prev => [...prev, ...data.data.transactions]);
          }
          setPagination(data.data.pagination);
        } else {
          throw new Error(data.message || 'Failed to fetch transactions');
        }
        
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }, 300), // 300ms debounce
    []
  );

  // Fetch transactions
  const fetchTransactions = useCallback((newFilters = {}) => {
    const mergedFilters = { ...filters, ...newFilters };
    setFilters(mergedFilters);
    debouncedFetchTransactions(mergedFilters);
  }, [filters, debouncedFetchTransactions]);

  // Load more transactions (for infinite scroll)
  const loadMore = useCallback(() => {
    if (pagination.has_next && !loading) {
      fetchTransactions({ page: pagination.current_page + 1 });
    }
  }, [pagination, loading, fetchTransactions]);

  // Reset and fetch first page
  const refresh = useCallback(() => {
    setTransactions([]);
    fetchTransactions({ page: 1 });
  }, [fetchTransactions]);

  // Apply filters
  const applyFilters = useCallback((newFilters) => {
    setTransactions([]);
    fetchTransactions({ ...newFilters, page: 1 });
  }, [fetchTransactions]);

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, []); // Only run once on mount

  return {
    transactions,
    loading,
    error,
    pagination,
    filters,
    fetchTransactions,
    loadMore,
    refresh,
    applyFilters,
    hasMore: pagination.has_next
  };
};

// Custom hook for transaction summary
export const useTransactionSummary = (filters = {}) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async (summaryFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.entries({ ...filters, ...summaryFilters }).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const response = await fetch(`/api/hp/transactions/summary?${queryParams}`, {
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
        setSummary(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch summary');
      }
      
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return {
    summary,
    loading,
    error,
    fetchSummary
  };
};

// Virtual scrolling hook for large datasets
export const useVirtualScrolling = (items, itemHeight = 50, containerHeight = 400) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
    const overscan = 5; // Render extra items for smooth scrolling
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(items.length - 1, startIndex + visibleItemsCount + overscan * 2);
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0
  });

  const measureRenderTime = useCallback((startTime) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    setMetrics(prev => ({
      ...prev,
      renderTime
    }));
    
    return renderTime;
  }, []);

  const measureApiCall = useCallback(async (apiCall) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: responseTime
      }));
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: responseTime
      }));
      
      throw error;
    }
  }, []);

  const updateMemoryUsage = useCallback(() => {
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      setMetrics(prev => ({
        ...prev,
        memoryUsage
      }));
    }
  }, []);

  // Monitor memory usage periodically
  useEffect(() => {
    const interval = setInterval(updateMemoryUsage, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [updateMemoryUsage]);

  return {
    metrics,
    measureRenderTime,
    measureApiCall,
    updateMemoryUsage
  };
};

// Optimized data formatting utilities
export const formatters = {
  currency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  },
  
  date: (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(new Date(date));
  },
  
  dateTime: (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },
  
  number: (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  }
};

// Optimized search and filter utilities
export const filterUtils = {
  debounceSearch: debounce((searchTerm, callback) => {
    callback(searchTerm);
  }, 500),
  
  createDateFilter: (startDate, endDate) => {
    const filters = {};
    if (startDate) {
      filters.start_date = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      filters.end_date = endDate.toISOString().split('T')[0];
    }
    return filters;
  },
  
  createAmountFilter: (minAmount, maxAmount) => {
    const filters = {};
    if (minAmount !== null && minAmount !== undefined) {
      filters.min_amount = minAmount;
    }
    if (maxAmount !== null && maxAmount !== undefined) {
      filters.max_amount = maxAmount;
    }
    return filters;
  }
};