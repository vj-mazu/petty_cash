import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { anamathApi, ledgerApi, Ledger, CreateAnamathEntryData } from '../../services/api';
import { formatIndianCurrency, formatDisplayAmount } from '../../utils/indianNumberFormat';
import {
  ArrowLeft,
  Save,
  BookOpen,
  Calculator,
  Info,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import LoadingSpinner from '../LoadingSpinner';

interface AnamathFormData {
  ledgerId?: string;
  amount: number;
  date: string;
  remarks: string;
}

const AnamathTransactionForm: React.FC = () => {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(true);
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  const [nextAnamathId, setNextAnamathId] = useState<string | null>(null);
  const [loadingAnamathId, setLoadingAnamathId] = useState(true);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<AnamathFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      remarks: ''
    },
    mode: 'onChange'
  });
  
  const watchedLedgerId = watch('ledgerId');
  const watchedAmount = watch('amount') || 0;

  useEffect(() => {
    fetchLedgers();
    fetchNextAnamathId();
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

  const fetchNextAnamathId = async () => {
    try {
      setLoadingAnamathId(true);
      // Get all anamath entries to find the highest existing ID number
      const response = await anamathApi.getAll({ limit: 1000 });
      if (response.success && response.data) {
        const entries = response.data.anamathEntries || [];
        
        // Find the highest existing transaction number
        let maxNumber = 0;
        entries.forEach(entry => {
          if (entry.transactionNumber && typeof entry.transactionNumber === 'number') {
            if (entry.transactionNumber > maxNumber) {
              maxNumber = entry.transactionNumber;
            }
          }
        });
        
        const nextNumber = maxNumber + 1;
        const nextId = `A${String(nextNumber).padStart(3, '0')}`;
        setNextAnamathId(nextId);
      }
    } catch (error: any) {
      console.error('Failed to fetch anamath entries for ID generation:', error);
    } finally {
      setLoadingAnamathId(false);
    }
  };

  const onSubmit = async (formData: AnamathFormData) => {
    try {
      console.log('Anamath form submission started with data:', formData);

      // Validation
      if (!formData.amount || formData.amount <= 0) {
        console.error('Invalid amount:', formData.amount);
        toast.error('Please enter a valid amount greater than 0');
        return;
      }

      if (!formData.remarks.trim()) {
        console.error('No remarks provided');
        toast.error('Remarks are required for Anamath entries');
        return;
      }

      // Create anamath entry using the dedicated anamath API
      const anamathData: CreateAnamathEntryData = {
        date: formData.date,
        amount: formData.amount,
        remarks: formData.remarks.trim(),
        referenceNumber: nextAnamathId || undefined, // Include the generated anamath ID
        ledgerId: formData.ledgerId || undefined // Optional ledger reference
      };

      console.log('Sending anamath data to API:', anamathData);
      const response = await anamathApi.create(anamathData);
      console.log('Anamath API response:', response);

      if (response.success) {
        console.log('Anamath entry created successfully');
        toast.success(
          `Anamath entry of ${formatIndianCurrency(formData.amount)} added successfully!`
        );
        console.log('Navigating to anamath page');
        navigate('/anamath');
      } else {
        console.error('Anamath creation failed:', response);
        toast.error(response.message || 'Failed to create anamath entry');
      }
    } catch (error: any) {
      console.error('Error creating anamath entry:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create anamath entry';
      toast.error(errorMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatIndianCurrency(amount);
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
          <h1 className="text-3xl font-bold text-amber-900">Add Anamath Entry</h1>
          <p className="text-gray-600 mt-1">Record a special entry</p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Transaction Type Display */}
          <div className="p-4 rounded-lg border-2 bg-amber-100 border-amber-300">
            <div className="flex items-center">
              <Calculator className="w-6 h-6 mr-3 text-amber-600" />
              <div>
                <div className="font-medium text-amber-900">Anamath Entry</div>
                <div className="text-sm text-amber-600">Special entry that doesn't affect balance</div>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-amber-800 mb-2">
              Date *
            </label>
            <input
              {...register('date', { required: 'Date is required' })}
              type="date"
              className="input-field border-amber-300 focus:border-amber-500 focus:ring-amber-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Ledger Selection - Now Optional */}
          <div>
            <label htmlFor="ledgerId" className="block text-sm font-medium text-amber-800 mb-2">
              Select Ledger (Optional)
            </label>
            <div className="relative">
              <select
                id="ledgerId"
                {...register('ledgerId')}
                className="input-field pl-10 pr-8 appearance-none bg-white border-amber-300 focus:border-amber-500 focus:ring-amber-500"
              >
                <option value="">No specific ledger (General entry)</option>
                {ledgers.map((ledger) => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="mt-1 text-xs text-amber-600">
              You can optionally associate this entry with a specific ledger for reference
            </p>
            {selectedLedger && (
              <div className="mt-3 p-4 bg-amber-100 rounded-lg border border-amber-300">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-amber-900">{selectedLedger.name}</div>
                    <div className="text-xs text-amber-600">Current Balance (unchanged)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-700">
                      {formatCurrency(selectedLedger.currentBalance)}
                    </div>
                    <div className="text-xs text-amber-600">Will remain the same</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Anamath ID - Auto-generated */}
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">
              Anamath ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={loadingAnamathId ? 'Loading...' : nextAnamathId || 'A + Auto-generated number'}
                className="input-field bg-amber-50 text-amber-700 cursor-not-allowed border-amber-300"
                readOnly
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-xs text-amber-500">Auto</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-amber-600">
              {nextAnamathId ? `Next available anamath ID: ${nextAnamathId}` : 'A unique anamath ID (A001, A002, etc.) will be assigned automatically'}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-amber-800 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 text-lg font-bold">₹</span>
              <input
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                type="number"
                step="0.01"
                min="0.01"
                className="input-field pl-10 py-2 text-base font-semibold border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-amber-800 mb-2">
              Remarks *
            </label>
            <textarea
              {...register('remarks', { required: 'Remarks are required for Anamath entries' })}
              rows={3}
              className="input-field border-amber-300 focus:border-amber-500 focus:ring-amber-500"
              placeholder="Please provide details for this Anamath entry..."
            />
            {errors.remarks && (
              <p className="mt-1 text-sm text-red-600">{errors.remarks.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-amber-200">
            <button
              type="button"
              onClick={() => navigate('/transactions/create')}
              className="btn-secondary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding Anamath Entry...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Add Anamath Entry
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AnamathTransactionForm;