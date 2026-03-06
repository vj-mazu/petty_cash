import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Plus, BookOpen, Trash2, Archive, Edit, Check, Search, Filter, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { ledgerApi, anamathApi, Ledger, AnamathEntry } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { exportToXlsx } from '../utils/export';
import { generateAnamathPDF, type AnamathEntry as AnamathPDFEntry } from '../utils/anamathPDFGenerator';
import { toTitleCase } from '../utils/textUtils';
import { formatIndianCurrency } from '../utils/indianNumberFormat';

const Anamath: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<AnamathEntry[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AnamathEntry[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingLedgers, setLoadingLedgers] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [recordToClose, setRecordToClose] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLedger, setSelectedLedger] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  // Role-based permissions
  const isAdmin = user?.role && ['admin', 'manager'].includes(user.role);
  const canDelete = isAdmin; // Only admins can delete

  // Fetch ledgers
  const fetchLedgers = useCallback(async () => {
    try {
      setLoadingLedgers(true);
      const response = await ledgerApi.getAll({ limit: 100 });
      if (response.success) {
        setLedgers(response.data.ledgers);
      }
    } catch (error) {
      console.error('Failed to fetch ledgers:', error);
      toast.error('Failed to load ledgers');
    } finally {
      setLoadingLedgers(false);
    }
  }, []);

  // Fetch Anamath records (exclude closed records)
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20
      };
      const response = await anamathApi.getAll(params);

      if (response.success) {
        console.log('🔍 DEBUG: Full API Response:', response);
        const recordsData = response.data.anamathEntries || [];
        console.log('🔍 DEBUG: Extracted Records:', recordsData);

        // Debug each record's transactionNumber
        recordsData.forEach((record, index) => {
          console.log(`🔍 DEBUG Record ${index + 1}:`, {
            id: record.id?.substring(0, 8) + '...',
            transactionNumber: record.transactionNumber,
            transactionNumberType: typeof record.transactionNumber,
            remarks: record.remarks,
            formattedId: record.transactionNumber ? `A${String(record.transactionNumber).padStart(3, '0')}` : '—'
          });
        });

        // Filter out closed records - only show open records
        const openRecords = recordsData.filter(record => !record.isClosed);
        setRecords(openRecords);
        setFilteredRecords(openRecords); // Initialize filtered records

        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        console.error('Failed to load Anamath records');
        setRecords([]);
        setFilteredRecords([]);
        toast.error('Failed to load Anamath records');
      }
    } catch (error) {
      console.error('Error fetching Anamath records:', error);
      toast.error('Failed to load Anamath records. Please try again.');
      setRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter records based on search criteria
  const filterRecords = useCallback(() => {
    let filtered = [...records];

    // Search term filter (search in remarks, ledger name, amount, and Anamath ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        // Generate Anamath ID for search
        const anamathId = record.transactionNumber ? `A${String(record.transactionNumber).padStart(3, '0')}` : '';

        return (
          // Search in remarks
          (record.remarks && record.remarks.toLowerCase().includes(term)) ||
          // Search in ledger name
          (record.ledger?.name && record.ledger.name.toLowerCase().includes(term)) ||
          // Search in amount
          (record.amount && record.amount.toString().includes(term)) ||
          // Search in Anamath ID (A001, A002, etc.)
          (anamathId && anamathId.toLowerCase().includes(term)) ||
          // Search in transaction number (1, 2, 3, etc.)
          (record.transactionNumber && record.transactionNumber.toString().includes(term))
        );
      });
    }

    // Ledger filter
    if (selectedLedger) {
      filtered = filtered.filter(record => record.ledgerId === selectedLedger);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(record => {
        const recordDate = format(parseISO(record.date), 'yyyy-MM-dd');
        return recordDate === dateFilter;
      });
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, selectedLedger, dateFilter]);

  // Apply filters when search criteria change
  useEffect(() => {
    filterRecords();
  }, [filterRecords]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLedger('');
    setDateFilter('');
    setShowFilters(false);
  };

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, currentPage]);

  // Handle refresh when coming back from CreateAnamath
  useEffect(() => {
    if (location.state?.refresh) {
      fetchRecords();
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchRecords]);

  const handleExport = async (type: 'pdf' | 'csv') => {
    if (type === 'pdf') {
      console.log('🔍 Anamath.tsx: Starting PDF export process with', records.length, 'records');

      // Validate records before processing
      if (!records || records.length === 0) {
        console.warn('⚠️ Anamath.tsx: No records available for PDF export');
        toast.error('No Anamath records available to export');
        return;
      }

      // Convert Anamath entries to PDF format with debugging
      const pdfEntries: AnamathPDFEntry[] = records.map((record, index) => {
        console.log(`🔍 Anamath.tsx: Processing record ${index + 1}:`, {
          id: record.id,
          amount: record.amount,
          ledger: record.ledger?.name
        });

        return {
          id: record.id,
          date: record.date,
          amount: record.amount,
          remarks: record.remarks,
          ledger: record.ledger,
          referenceNumber: record.referenceNumber,
          createdBy: typeof record.createdBy === 'string'
            ? { username: record.createdBy }
            : record.createdBy,
          transactionNumber: record.transactionNumber,
          displayTransactionNumber: record.displayTransactionNumber
        };
      });

      // Calculate date range
      const dateRange = records.length > 0 ? {
        start: format(parseISO(records[records.length - 1].date), 'dd/MM/yyyy'),
        end: format(parseISO(records[0].date), 'dd/MM/yyyy')
      } : undefined;

      console.log('📊 Anamath.tsx: Date range for PDF:', dateRange);

      try {
        console.log('🔄 Anamath.tsx: Calling generateAnamathPDF...');
        const success = generateAnamathPDF(pdfEntries, {
          companyName: 'MRN INDUSTRIES',
          dateRange,
          includeCreatedBy: true,
          includeReference: true
        });

        if (success) {
          console.log('✅ Anamath.tsx: PDF export completed successfully');
          toast.success('Anamath PDF exported successfully!');
        } else {
          console.error('❌ Anamath.tsx: PDF generation returned false');
          toast.error('Failed to generate Anamath PDF');
        }
      } catch (error) {
        console.error('❌ Anamath.tsx: PDF export error:', error);
        toast.error('Failed to export PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else if (type === 'csv') {
      exportToXlsx(records, 'Anamath Records');
    }
  };

  const handleExportPDF = () => handleExport('pdf');
  const handleExportExcel = () => handleExport('csv');

  const handleDelete = (id: string) => {
    setRecordToDelete(id);
    setIsModalOpen(true);
  };

  const onConfirmDelete = async () => {
    if (recordToDelete) {
      try {
        const response = await anamathApi.delete(recordToDelete);
        if (response.success) {
          toast.success('Record deleted successfully');
          fetchRecords();
        } else {
          toast.error('Failed to delete record');
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error('Failed to delete record. Please try again.');
      }
    }
    setIsModalOpen(false);
    setRecordToDelete(null);
  };

  const handleClose = (id: string) => {
    setRecordToClose(id);
    setIsCloseModalOpen(true);
  };

  const onConfirmClose = async () => {
    if (recordToClose) {
      // Optimistically remove from UI immediately to avoid caching delay
      setRecords(prev => prev.filter(r => r.id !== recordToClose));
      setFilteredRecords(prev => prev.filter(r => r.id !== recordToClose));

      try {
        console.log('Attempting to close record:', recordToClose);
        const response = await anamathApi.close(recordToClose);
        if (response.success) {
          console.log('Record closed successfully');
          toast.success('Record closed successfully');
          // No need to fetchRecords here since we optimistically updated and this endpoint may be cached
        } else {
          console.error('Failed to close record:', response);
          toast.error('Failed to close record');
        }
      } catch (error) {
        console.error('Error closing record:', error);
        toast.error('Failed to close record. Please try again.');
      }
    }
    setIsCloseModalOpen(false);
    setRecordToClose(null);
  };

  const handleApproveAnamath = async (id: string) => {
    try {
      setIsApproving(id);
      const response = await anamathApi.approve(id);
      if (response.success) {
        toast.success('Anamath entry approved successfully');
        fetchRecords();
      } else {
        toast.error(response.message || 'Failed to approve anamath entry');
      }
    } catch (error: any) {
      console.error('Anamath approval error:', error);
      toast.error(error.response?.data?.message || 'Error occurred during approval');
    } finally {
      setIsApproving(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Anamath records..." />;
  }

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Anamath Records</h1>
            {records.length > 0 && (
              <span className="ml-3 px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                Total: {formatIndianCurrency(records.reduce((total, record) => total + Number(record.amount || 0), 0))}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate('/anamath/closed')}
              className="flex items-center px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
            >
              <Archive className="w-3 h-3 mr-1" />
              Closed
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
            >
              <Download className="w-3 h-3 mr-1" />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
            >
              <Download className="w-3 h-3 mr-1" />
              Excel
            </button>
            <button
              onClick={() => navigate('/transactions/create/anamath')}
              className="flex items-center px-2 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Anamath ID (A001), ledger name, remarks, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Clear Filters */}
          {(searchTerm || selectedLedger || dateFilter) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Ledger
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredRecords.length} of {records.length} records
          {(searchTerm || selectedLedger || dateFilter) && (
            <span className="text-blue-600 ml-2">(filtered)</span>
          )}
        </div>
      </div>

      {/* Records Table - Excel Style */}
      <div className="overflow-x-auto shadow-xl rounded-lg border-2 border-gray-300 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-1.5 py-1 text-center w-10 bg-gray-100 font-bold text-xs">SL</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center w-24 bg-blue-100 font-bold text-xs">DATE</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center w-16 bg-indigo-100 font-bold text-xs">ID</th>
              <th className="border border-gray-400 px-1.5 py-1 text-left bg-yellow-100 font-bold text-xs">LEDGER</th>
              <th className="border border-gray-400 px-1.5 py-1 text-left bg-green-100 font-bold text-xs">AMOUNT</th>
              <th className="border border-gray-400 px-1.5 py-1 text-left bg-blue-50 font-bold text-xs">REMARKS</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center w-20 bg-orange-100 font-bold text-xs">STATUS</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center w-28 bg-gray-200 font-bold text-xs">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => {
                const ledger = record.ledger || (record.ledgerId ? ledgers.find(l => l.id === record.ledgerId) : null);
                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${(record as any).status === 'pending' ? 'bg-yellow-50/50' : ''}`}
                  >
                    <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">{index + 1}</td>
                    <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                      {format(parseISO(record.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="border border-gray-300 px-1.5 py-1 text-center text-xs font-mono font-medium">
                      {record.transactionNumber ? `A${String(record.transactionNumber).padStart(3, '0')}` : '—'}
                    </td>
                    <td className="border border-gray-300 px-1.5 py-1 text-left text-xs">
                      {toTitleCase(ledger?.name || 'General Entry')}
                    </td>
                    <td className="border border-gray-300 px-1.5 py-1 text-left text-xs font-medium text-amber-700">
                      {formatIndianCurrency(record.amount)}
                    </td>
                    <td className="border border-gray-300 px-1.5 py-1 text-left text-xs min-w-[80px]">
                      {toTitleCase(record.remarks || '-')}
                    </td>
                    <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${(record as any).status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : (record as any).status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 animate-pulse'
                          : 'bg-red-100 text-red-700'
                        }`}>
                        {(record as any).status || 'approved'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-1.5 py-1 text-center">
                      <div className="flex justify-center items-center space-x-1">
                        {(record as any).status === 'pending' && isAdmin && (
                          <button
                            onClick={() => handleApproveAnamath(record.id)}
                            disabled={isApproving === record.id}
                            className="p-1 rounded text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                            title="Approve"
                          >
                            {isApproving === record.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600"></div>
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/anamath/${record.id}/edit`)}
                          className="p-1 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleClose(record.id)}
                          className="p-1 rounded text-green-600 hover:text-green-800 hover:bg-green-50 transition-colors"
                          title="Close Record"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1 rounded text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center">
                  <div className="text-gray-400">
                    <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {(searchTerm || selectedLedger || dateFilter) ? 'No records found matching your filters.' : 'Create a new Anamath entry to get started.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination View */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
      />

      <ConfirmModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={onConfirmClose}
        title="Accept Record"
        message="Are you sure you want to accept this record? You can reopen it later from the closed records view."
        confirmButtonText="Accept"
        confirmButtonColor="green"
      />
    </div >
  );
};

export default Anamath;