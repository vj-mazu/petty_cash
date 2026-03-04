import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { transactionApi, ledgerApi, Ledger, CreateTransactionData } from '../../services/api';
import { formatIndianCurrency, formatDisplayAmount } from '../../utils/indianNumberFormat';
import {
  ArrowLeft,
  Save,
  BookOpen,
  TrendingDown,
  AlertTriangle,
  Calculator
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import LoadingSpinner from '../LoadingSpinner';

interface DebitFormData {
  ledgerId: string;
  amount: number;
  date: string;
  reference?: string;
  remarks?: string;
}

const DebitTransactionForm: React.FC = () => {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(true);
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DebitFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      reference: ''
    }
  });
  
  const watchedLedgerId = watch('ledgerId');
  const watchedAmount = watch('amount') || 0;

  useEffect(() => {
    fetchLedgers();
  }, []);

  useEffect(() => {
    if (watchedLedgerId) {
      const ledger = ledgers.find(l => l.id === watchedLedgerId);
      setSelectedLedger(ledger || null);
    }
  }, [watchedLedgerId, ledgers]);

  const fetchLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const response = await ledgerApi.getAll({ limit: 100 });
      if (response.success) {
        setLedgers(response.data.ledgers);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch ledgers');
    } finally {
      setLoadingLedgers(false);
    }
  };

  const onSubmit = async (formData: DebitFormData) => {
    try {
      console.log('Debit form submission started with data:', formData);

      // Validation
      if (!formData.ledgerId) {
        console.error('No ledger selected');
        toast.error('Please select a ledger');
        return;
      }

      if (!formData.amount || formData.amount <= 0) {
        console.error('Invalid amount:', formData.amount);
        toast.error('Please enter a valid amount greater than 0');
        return;
      }

      // Check if sufficient balance
      if (selectedLedger && selectedLedger.currentBalance < formData.amount) {
        console.error('Insufficient balance. Current:', selectedLedger.currentBalance, 'Required:', formData.amount);
        toast.error('Insufficient balance for this debit transaction');
        return;
      }



      // Create debit transaction
      const transactionData: CreateTransactionData = {
        ledgerId: formData.ledgerId,
        remarks: formData.remarks?.trim() || undefined,
        date: formData.date,
        reference: formData.reference?.trim() || undefined,
        debitAmount: formData.amount,
        creditAmount: 0,
        type: 'debit'
      };

      console.log('Sending debit transaction data to API:', transactionData);
      const response = await transactionApi.create(transactionData);
      console.log('Debit transaction API response:', response);

      if (response.success) {
        console.log('Debit transaction created successfully');

        toast.success(
          `Debit transaction of ${formatIndianCurrency(formData.amount)} added successfully!`
        );
        
        console.log('Navigating to transactions page');
        navigate('/transactions');
      } else {
        console.error('Debit transaction creation failed:', response);
        toast.error(response.message || 'Failed to create debit transaction');
      }
    } catch (error: any) {
      console.error('Debit transaction submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create debit transaction';
      toast.error(errorMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatIndianCurrency(amount);
  };

  const calculateNewBalance = (currentBalance: number, amount: number) => {
    return currentBalance - amount;
  };

  const isInsufficientBalance = (): boolean => {
    return selectedLedger ? selectedLedger.currentBalance < watchedAmount : false;
  };

  if (loadingLedgers) {
    return <LoadingSpinner message="Loading ledgers..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/transactions/create')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-red-900">ADD ANAMATH</h1>
          <p className="text-gray-600 mt-1">Record money going out</p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Transaction Type Display */}
          <div className="p-4 rounded-lg border-2 bg-red-100 border-red-300">
            <div className="flex items-center">
              <TrendingDown className="w-6 h-6 mr-3 text-red-600" />
              <div>
                <div className="font-medium text-red-900">Add Anamath Entry (-)</div>
                <div className="text-sm text-red-600">Money going out</div>
              </div>
            </div>
          </div>

          {/* Ledger Selection */}
          <div>
            <label htmlFor="ledgerId" className="block text-sm font-medium text-red-800 mb-2">
              Select Ledger *
            </label>
            <div className="relative">
              <select
                id="ledgerId"
                {...register('ledgerId', { required: 'Ledger is required' })}
                className="input-field pl-10 pr-8 appearance-none bg-white border-red-300 focus:border-red-500 focus:ring-red-500"
              >
                <option value="">Choose a ledger...</option>
                {ledgers.map((ledger) => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <BookOpen className="w-5 h-5 text-red-400" />
              </div>
            </div>
            {errors.ledgerId && (
              <p className="mt-1 text-sm text-red-600">{errors.ledgerId.message}</p>
            )}
            {selectedLedger && (
              <div className="mt-3 p-4 bg-red-100 rounded-lg border border-red-300">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-red-900">{selectedLedger.name}</div>
                    <div className="text-xs text-red-600">Available Balance</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      selectedLedger.currentBalance >= 0 ? 'text-red-700' : 'text-red-800'
                    }`}>
                      {formatCurrency(selectedLedger.currentBalance)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-red-800 mb-2">
              Anamath Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600 text-lg font-bold">₹</span>
              <input
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                type="number"
                step="0.01"
                min="0.01"
                className={`input-field w-full pl-12 py-4 text-2xl font-semibold border-red-300 focus:border-red-500 focus:ring-red-500 ${
                  isInsufficientBalance() ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
            {isInsufficientBalance() && (
              <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-sm text-red-700">
                  Insufficient balance! Available: {formatCurrency(selectedLedger?.currentBalance || 0)}
                </p>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-red-800 mb-2">
              Date *
            </label>
            <input
              {...register('date', { required: 'Date is required' })}
              type="date"
              className="input-field border-red-300 focus:border-red-500 focus:ring-red-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Reference */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-red-800 mb-2">
              Reference (Optional)
            </label>
            <input
              {...register('reference')}
              type="text"
              className="input-field border-red-300 focus:border-red-500 focus:ring-red-500"
              placeholder="Optional reference number or note..."
            />
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-red-800 mb-2">
              Remarks (Optional)
            </label>
            <input
              {...register('remarks')}
              type="text"
              className="input-field border-red-300 focus:border-red-500 focus:ring-red-500"
              placeholder="Optional remarks..."
            />
          </div>

          {/* New Balance Preview */}
          {selectedLedger && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border-2 shadow-lg ${
                isInsufficientBalance() 
                  ? 'bg-gradient-to-r from-red-100 to-red-200 border-red-400'
                  : 'bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-bold ${
                    isInsufficientBalance() ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    After this debit transaction
                  </div>
                  {isInsufficientBalance() && (
                    <div className="flex items-center mt-1">
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                      <span className="text-xs text-red-600">Insufficient balance</span>
                    </div>
                  )}
                </div>
                <div className={`text-right ${
                  isInsufficientBalance() ? 'text-red-900' : 'text-orange-900'
                }`}>
                  <div className="text-xl font-bold">
                    {formatCurrency(calculateNewBalance(selectedLedger.currentBalance, watchedAmount))}
                  </div>
                  <div className="text-xs opacity-75">
                    Current: {formatCurrency(selectedLedger.currentBalance)}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className={`text-sm font-medium ${
                  isInsufficientBalance() ? 'text-red-600' : 'text-orange-600'
                }`}>
                  -{formatCurrency(watchedAmount)}
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-red-200">
            <button
              type="button"
              onClick={() => navigate('/transactions/create')}
              className="btn-secondary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInsufficientBalance()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding Debit...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Add Debit Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DebitTransactionForm;