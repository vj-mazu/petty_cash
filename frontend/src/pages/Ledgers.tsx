// src/pages/Ledgers.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ledgerApi, Ledger } from '../services/api';
import {
  Plus,
  Search,
  Trash2,
  Filter,
  BookOpen
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const Ledgers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Role-based permissions
  const isAdmin = user?.role && ['admin', 'manager'].includes(user.role);
  const canEdit = isAdmin; // Only admins can edit
  const canDelete = isAdmin; // Only admins can delete

  const handleSearch = (value: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 500);

    setSearchTimeout(timeout);
  };

  useEffect(() => {
    fetchLedgers();
  }, [currentPage, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
  };

  const isFilterActive = () => {
    return searchQuery !== '';
  };

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined
      };

      const response = await ledgerApi.getAll(params);
      if (response.success) {
        setLedgers(response.data.ledgers);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch ledgers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await ledgerApi.delete(id);
      if (response.success) {
        toast.success('Ledger deleted successfully');
        setLedgers(ledgers.filter(ledger => ledger.id !== id));
        setShowDeleteModal(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete ledger');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      asset: '#3b82f6', // blue-500
      liability: '#ef4444', // red-500
      equity: '#8b5cf6', // purple-500
      revenue: '#10b981', // emerald-500
      expense: '#f59e0b' // amber-500
    };
    return colors[type as keyof typeof colors] || '#9ca3af'; // gray-400
  };

  const canModify = true; // All users are admin now
  // const canDelete = true; // All users are admin now - commented out to remove warning

  if (loading && ledgers.length === 0) {
    return <LoadingSpinner message="Loading ledgers..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            📚 Ledgers
          </h1>
          <p className="mt-2 text-gray-600 flex items-center">
            💰 Manage your account ledgers and balances
          </p>
        </div>
        {canModify && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/ledgers/create')}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 flex items-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            ✨ Create Ledger
          </motion.button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ledgers by name or details..."
              className="input-field pl-10 w-full"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ledgers Table - Excel-like format */}
      {ledgers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ledgers found</h3>
          <p className="text-gray-500 mb-6">Create your first ledger to start managing your finances</p>
          {canModify && (
            <button
              onClick={() => navigate('/ledgers/create')}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              Create First Ledger
            </button>
          )}
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
          {/* Table Header with Colorful styling */}
          <div className="grid grid-cols-12 gap-0 border-b-2 border-gray-400 bg-gradient-to-r from-blue-500 to-purple-600 font-bold text-white">
            <div className="col-span-4 p-3 border-r border-white/20 text-left">Ledger Name</div>
            <div className="col-span-5 p-3 border-r border-white/20 text-left">Remarks</div>
            <div className="col-span-2 p-3 border-r border-white/20 text-left">Created Date</div>
            <div className="col-span-1 p-3 text-center">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-300">
            {ledgers.map((ledger, index) => (
              <motion.div
                key={ledger.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`grid grid-cols-12 gap-0 transition-colors duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
                onClick={() => navigate(`/ledgers/${ledger.id}`)}
              >
                {/* Ledger Name */}
                <div className="col-span-4 p-3 border-r border-gray-200 font-medium text-gray-800 truncate bg-white">
                  {ledger.name}
                </div>

                {/* Description */}
                <div className="col-span-5 p-3 text-gray-600 border-r border-gray-200 truncate">
                  {ledger.description || '-'}
                </div>

                {/* Created Date */}
                <div className="col-span-2 p-3 text-gray-600 border-r border-gray-200 text-sm">
                  {format(new Date(ledger.createdAt), 'MMM dd, yyyy')}
                </div>

                {/* Actions */}
                <div className="col-span-1 p-3 flex items-center justify-center space-x-2">
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/ledgers/${ledger.id}/edit`);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(ledger.id);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm rounded-md ${currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Delete Ledger</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this ledger? This action cannot be undone and will also delete all associated transactions.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Ledgers;