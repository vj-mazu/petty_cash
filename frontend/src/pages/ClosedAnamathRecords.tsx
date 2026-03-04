import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Archive, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { ledgerApi, anamathApi, Ledger, AnamathEntry } from '../services/api';

import { exportClosedRecordsToXlsx } from '../utils/export';
import { generateClosedAnamathPDF, type AnamathEntry as AnamathPDFEntry } from '../utils/anamathPDFGenerator';
import { toTitleCase } from '../utils/textUtils';

import { formatIndianCurrency } from '../utils/indianNumberFormat';

const ClosedAnamathRecords: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [closedRecords, setClosedRecords] = useState<AnamathEntry[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingLedgers, setLoadingLedgers] = useState<boolean>(true);

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

  // Fetch Closed Anamath records
  const fetchClosedRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        limit?: number;
      } = { 
        limit: 100
      };
      
      const response = await anamathApi.getClosed(params);
      
      if (response.success) {
        console.log('Closed Records API Response:', response);
        const recordsData = response.data.anamathEntries || [];
        console.log('Extracted Closed Records:', recordsData);
        
        setClosedRecords(recordsData);
      } else {
        console.error('Failed to load closed Anamath records');
        setClosedRecords([]);
        toast.error('Failed to load closed Anamath records');
      }
    } catch (error) {
      console.error('Error fetching closed Anamath records:', error);
      toast.error('Failed to load closed Anamath records. Please try again.');
      setClosedRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  useEffect(() => {
    fetchClosedRecords();
  }, [fetchClosedRecords]);

  const handleExport = async (type: 'pdf' | 'csv') => {
    if (type === 'pdf') {
      console.log('🔍 ClosedAnamathRecords.tsx: Starting PDF export with', closedRecords.length, 'records');
      
      // Check if there are any closed records
      if (closedRecords.length === 0) {
        console.warn('⚠️ ClosedAnamathRecords.tsx: No closed records available');
        toast.error('No closed anamath records found to export');
        return;
      }

      // Prepare data for PDF export with proper structure for closed records
      const pdfData = closedRecords.map((record, index) => {
        console.log(`🔍 ClosedAnamathRecords.tsx: Processing record ${index + 1}:`, {
          id: record.id,
          amount: record.amount,
          ledger: record.ledger?.name,
          closedAt: record.closedAt
        });
        
        return {
          serialNo: index + 1,
          date: record.date,
          closedDate: record.closedAt || record.date,
          anamathId: record.referenceNumber || '-',
          ledgerName: record.ledger?.name || 'General Entry',
          amount: formatIndianCurrency(record.amount), // Use formatIndianCurrency for proper Indian format
          remarks: record.remarks || '-',
          // Required fields for TransactionData interface
          particulars: record.ledger?.name || 'General Entry',
          debit: '0.00',
          credit: formatIndianCurrency(record.amount) // Use formatIndianCurrency for proper Indian format
        };
      });

      console.log('📊 ClosedAnamathRecords.tsx: PDF Data prepared:', pdfData.length, 'entries');
      
      try {
        console.log('🔄 ClosedAnamathRecords.tsx: Converting to PDF entries...');
        // Convert closed records to PDF format
        const pdfEntries: AnamathPDFEntry[] = closedRecords.map(record => ({
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
          displayTransactionNumber: record.displayTransactionNumber,
          closedAt: record.closedAt,
          isClosed: true
        }));
        
        // Calculate date range
        const dateRange = closedRecords.length > 0 ? {
          start: format(parseISO(closedRecords[closedRecords.length - 1].date), 'dd/MM/yyyy'),
          end: format(parseISO(closedRecords[0].date), 'dd/MM/yyyy')
        } : undefined;
        
        console.log('📊 ClosedAnamathRecords.tsx: Date range:', dateRange);
        console.log('🔄 ClosedAnamathRecords.tsx: Calling generateClosedAnamathPDF...');
        
        const success = await generateClosedAnamathPDF(pdfEntries, {
          companyName: 'MRN INDUSTRIES',
          dateRange,
          includeCreatedBy: true,
          includeReference: true
        });
        
        if (success) {
          console.log('✅ ClosedAnamathRecords.tsx: PDF export completed successfully');
          toast.success('Closed Anamath records PDF exported successfully!');
        } else {
          console.error('❌ ClosedAnamathRecords.tsx: PDF generation returned false');
          toast.error('Failed to generate PDF');
        }
      } catch (error) {
        console.error('❌ ClosedAnamathRecords.tsx: PDF export error:', error);
        toast.error('Failed to export PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      // CSV/Excel export - create simple object array for XLSX
      const csvData = closedRecords.map((record, index) => ({
        'S.No': index + 1,
        'Entry Date': format(parseISO(record.date), 'dd/MM/yyyy'),
        'Closed Date': record.closedAt ? format(parseISO(record.closedAt), 'dd/MM/yyyy') : format(parseISO(record.date), 'dd/MM/yyyy'),
        'Anamath ID': record.referenceNumber || '-',
        'Ledger Name': toTitleCase(record.ledger?.name || 'General Entry'),
        'Amount': formatIndianCurrency(record.amount), // Use formatIndianCurrency for proper Indian format
        'Remarks': toTitleCase(record.remarks || '-')
      }));
      
      try {
        // Use the new export function for closed records
        await exportClosedRecordsToXlsx(csvData, 'Closed_Anamath_Records');
        toast.success('Excel file exported successfully!');
      } catch (error) {
        console.error('Excel export failed:', error);
        toast.error('Failed to export Excel file');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading closed Anamath records..." />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header - Smaller and moved to top */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-4 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center mb-1">
              <button
                onClick={() => navigate('/anamath')}
                className="mr-3 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-lg md:text-xl font-bold">Closed Anamath Records</h1>
            </div>
            <p className="text-gray-100 text-sm">View all closed anamath entries</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            {/* Total Amount - Blue Box */}
            {closedRecords.length > 0 && (
              <div className="bg-blue-600 px-4 py-2 rounded-lg shadow-md">
                <div className="text-xs text-blue-100">Total Amount</div>
                <div className="text-lg font-bold text-white">
                  {formatIndianCurrency(closedRecords.reduce((sum, record) => sum + (parseFloat(record.amount?.toString() || '0') || 0), 0))}
                </div>
              </div>
            )}
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 focus:outline-none transition-colors duration-200"
            >
              <Archive className="w-3 h-3 mr-1" />
              PDF
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 focus:outline-none transition-colors duration-200"
            >
              <Archive className="w-3 h-3 mr-1" />
              Excel
            </button>
            <button
              onClick={fetchClosedRecords}
              className="flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 focus:outline-none transition-colors duration-200"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Closed Records Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closed Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anamath ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ledger Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {closedRecords.length > 0 ? (
                closedRecords.map((record, index) => {
                  const ledger = record.ledger || (record.ledgerId ? ledgers.find(l => l.id === record.ledgerId) : null);
                  return (
                    <motion.tr 
                      key={record.id} 
                      className="hover:bg-gray-50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Archive className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                          {format(parseISO(record.date), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {record.closedAt ? format(parseISO(record.closedAt), 'dd MMM yyyy') : '—'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {record.closedAt ? format(parseISO(record.closedAt), 'HH:mm') : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {record.transactionNumber ? `A${String(record.transactionNumber).padStart(3, '0')}` : (record.referenceNumber || '—')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <BookOpen className="flex-shrink-0 h-4 w-4 text-amber-400 mr-2" />
                          <span>{toTitleCase(ledger?.name || 'General Entry')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-amber-600">
                        {formatIndianCurrency(record.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={record.remarks}>
                        {toTitleCase(record.remarks || '-')}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="text-gray-400">
                      <Archive className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No closed records</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Closed anamath records will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom summary removed - Total amount now shown only in blue box at top */}
    </div>
  );
};

export default ClosedAnamathRecords;