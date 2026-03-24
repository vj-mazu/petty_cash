import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { transactionApi, ledgerApi, anamathApi, Ledger, CreateTransactionData } from '../services/api';
import { parseIndianNumber, formatIndianNumber } from '../utils/indianNumberFormat';
import {
  ArrowLeft,
  Save,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { toTitleCase } from '../utils/textUtils';

type TransactionType = 'debit' | 'credit' | 'amount' | 'anamath' | 'combined';

interface CreateTransactionForm {
  ledgerId?: string;
  amount: number;
  type: TransactionType;
  date: string;
  description?: string;
  remarks?: string;
  saveOption?: 'single' | 'withAnamath';
}

interface CreateTransactionProps {
  type?: TransactionType;
}

const CreateTransaction: React.FC<CreateTransactionProps> = ({ type: propType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(true);

  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);
  const [nextTransactionNumber, setNextTransactionNumber] = useState<number | null>(null);
  const [loadingTransactionNumber, setLoadingTransactionNumber] = useState(true);
  const [nextAnamathId, setNextAnamathId] = useState<string | null>(null);
  const [loadingAnamathId, setLoadingAnamathId] = useState(true);

  // Determine transaction type from props or URL
  const getTransactionType = (): TransactionType => {
    if (propType) return propType;
    const path = location.pathname;
    if (path.includes('/credit')) return 'credit';
    if (path.includes('/debit')) return 'debit';
    if (path.includes('/amount')) return 'amount';
    if (path.includes('/anamath')) return 'anamath';
    return 'credit'; // default
  };

  const transactionType = getTransactionType();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
    clearErrors,
    setError
  } = useForm<CreateTransactionForm>({
    defaultValues: {
      type: transactionType,
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      remarks: '',
      ledgerId: '',
      saveOption: 'single'
    },
    mode: 'onChange',
    criteriaMode: 'all'
  });

  // Watch form values
  const watchedLedgerId = watch('ledgerId');
  const watchedAmount = watch('amount');

  // State for formatted amount display
  const [displayAmount, setDisplayAmount] = useState<string>('0');

  // Reset form function - clears form and prepares for next entry
  const resetForm = () => {
    reset({
      type: transactionType,
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      remarks: '',
      ledgerId: '',
      saveOption: 'single'
    });
    setDisplayAmount('0');
    clearErrors();
  };

  // Register amount field with validation
  useEffect(() => {
    register('amount', {
      required: 'Amount is required',
      min: {
        value: 0.01,
        message: 'Must be greater than 0'
      }
    });
  }, [register]);

  useEffect(() => {
    fetchLedgers();
    if (transactionType !== 'anamath') {
      fetchNextTransactionNumber();
    }
    // Always fetch anamath ID for combined save functionality
    fetchNextAnamathId();
  }, [transactionType]);

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

  const fetchNextTransactionNumber = async () => {
    try {
      setLoadingTransactionNumber(true);
      const response = await transactionApi.getNextNumber();
      if (response.success && response.data) {
        setNextTransactionNumber(response.data.nextTransactionNumber);
      }
    } catch (error: any) {
      console.error('Failed to fetch next transaction number:', error);
    } finally {
      setLoadingTransactionNumber(false);
    }
  };

  const fetchNextAnamathId = async () => {
    try {
      setLoadingAnamathId(true);
      // Get all anamath entries to find the highest existing ID number
      const response = await anamathApi.getAll({ limit: 1000 });

      if (response.success && response.data) {
        const entries = response.data.anamathEntries || [];
        console.log(`📊 Found ${entries.length} anamath entries`);

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
        console.log(`✅ Calculated next anamath ID: ${nextId}`);
        setNextAnamathId(nextId);
      } else {
        console.error('❌ API response not successful or no data:', response);
        setNextAnamathId(null);
      }
    } finally {
      setLoadingAnamathId(false);
    }
  };

  const handleAnamath = useCallback(async (formData: CreateTransactionForm) => {
    try {
      const anamathData = {
        date: formData.date,
        amount: formData.amount,
        remarks: formData.remarks?.trim() ? toTitleCase(formData.remarks.trim()) : '',
        ledgerId: formData.ledgerId
      };

      const response = await anamathApi.create(anamathData);

      if (!response.success) {
        throw new Error(response.message || 'Failed to save Anamath entry');
      }

      if (!response.data) {
        throw new Error('Invalid response from server when saving Anamath entry');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const handleRegularTransaction = useCallback(async (formData: CreateTransactionForm) => {
    if (!formData.ledgerId) {
      return null;
    }

    const isCredit = transactionType === 'credit';
    const remarks = formData.remarks?.trim() ? toTitleCase(formData.remarks.trim()) : null;

    try {
      const amount = Number(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const transactionData = {
        ledgerId: formData.ledgerId,
        remarks, // Changed from 'description' to 'remarks' to match backend
        date: formData.date,
        debitAmount: isCredit ? 0 : amount,
        creditAmount: isCredit ? amount : 0,
        type: isCredit ? 'credit' as const : 'debit' as const,
        transactionType: 'regular' as const,
        referenceNumber: `${isCredit ? 'CR' : 'DR'}-${Date.now()}`
      };

      const response = await transactionApi.create(transactionData);

      if (response && typeof response === 'object') {
        if ('success' in response && response.success === false) {
          throw new Error(response.message || 'Failed to save transaction');
        }
        return response;
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction');
      throw error;
    }
  }, [transactionType]);

  const handleFormSubmit = async (formData: CreateTransactionForm, saveOption: 'single' | 'withAnamath' = 'single') => {
    setIsFormSubmitting(true);

    try {
      const amount = Number(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('amount', { type: 'min', message: 'Please enter a valid amount greater than 0' });
        setIsFormSubmitting(false);
        return;
      }
      formData.amount = amount;

      if (saveOption === 'withAnamath' && transactionType !== 'anamath') {
        const transactionData: CreateTransactionData = {
          ledgerId: formData.ledgerId!,
          date: formData.date,
          remarks: formData.remarks?.trim() || null, // Transaction remarks optional - can be empty
          debitAmount: transactionType === 'debit' ? formData.amount : 0,
          creditAmount: transactionType === 'credit' ? formData.amount : 0,
          transactionType: 'combined',
          reference: 'A',
          referenceNumber: `COMB-${Date.now()}`,
          type: transactionType === 'amount' ? 'credit' : transactionType as 'debit' | 'credit' | 'anamath',
          // Add anamath-specific fields for combined transaction
          anamathAmount: formData.amount,
          // Anamath remarks: Use user's remarks if provided, otherwise send null (backend will use fallback)
          anamathRemarks: formData.remarks?.trim() ? toTitleCase(formData.remarks.trim()) : null,
          anamathLedgerId: formData.ledgerId
        };

        const transactionResponse = await transactionApi.create(transactionData);

        if (transactionResponse.success) {
          await fetchNextAnamathId();
          await fetchNextTransactionNumber();
          toast.success(`Combined transaction created successfully! Ready for next entry.`);
          // Add small delay to let backend finish balance recalculation
          await new Promise(resolve => setTimeout(resolve, 500));
          // STAY ON SAME PAGE - Reset form for next entry
          resetForm();
        } else {
          toast.error(transactionResponse.message || 'Failed to create combined transaction');
        }
      } else if (transactionType === 'anamath') {
        const response = await handleAnamath(formData);
        if (response && response.success) {
          await fetchNextAnamathId();
          toast.success('Anamath entry saved successfully! Ready for next entry.');
          resetForm();
        }
      } else {
        const response = await handleRegularTransaction(formData);
        if (response?.success) {
          await fetchNextTransactionNumber();
          toast.success('Transaction saved successfully! Ready for next entry.');
          // Add small delay to let backend finish balance recalculation
          await new Promise(resolve => setTimeout(resolve, 500));
          // STAY ON SAME PAGE - Reset form for next entry
          resetForm();
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred during submission.';
      toast.error(errorMessage);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const onSubmit = (data: CreateTransactionForm, saveOptionOrEvent?: 'single' | 'withAnamath' | React.BaseSyntheticEvent) => {
    let saveOption: 'single' | 'withAnamath' = 'single';

    if (typeof saveOptionOrEvent === 'string') {
      saveOption = saveOptionOrEvent;
    } else if (saveOptionOrEvent && saveOptionOrEvent.nativeEvent instanceof SubmitEvent) {
      const submitter = (saveOptionOrEvent.nativeEvent as any).submitter as HTMLButtonElement | null;
      if (submitter?.name === 'withAnamath') {
        saveOption = 'withAnamath';
      }
    }

    handleFormSubmit(data, saveOption);
  };

  if (loadingLedgers) {
    return <LoadingSpinner message="Loading ledgers..." />;
  }
  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/transactions/create')}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className={`text-xl font-bold ${transactionType === 'credit' ? 'text-emerald-900' :
            transactionType === 'debit' ? 'text-red-900' :
              'text-amber-900'
            }`}>
            Add {transactionType === 'credit' ? 'Credit' : transactionType === 'debit' ? 'Debit' : 'Anamath'}
          </h1>
          <p className="text-sm text-gray-600">
            {transactionType === 'credit' ? 'Record money coming in' :
              transactionType === 'debit' ? 'Record money going out' :
                'Record a special entry'}
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4"
      >
        <form onSubmit={handleSubmit((data, e) => onSubmit(data, e))} className="space-y-4">
          {/* Transaction Type Display */}
          <div className={`p-3 rounded-lg border ${transactionType === 'credit' ? 'bg-emerald-50 border-emerald-200' :
            transactionType === 'debit' ? 'bg-red-50 border-red-200' :
              'bg-amber-50 border-amber-200'
            }`}>
            <div className="flex items-center">
              {transactionType === 'credit' ? (
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
              ) : transactionType === 'debit' ? (
                <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
              ) : (
                <Calculator className="w-5 h-5 mr-2 text-amber-600" />
              )}
              <div>
                <div className={`text-sm font-medium ${transactionType === 'credit' ? 'text-emerald-900' :
                  transactionType === 'debit' ? 'text-red-900' :
                    'text-amber-900'
                  }`}>
                  {transactionType === 'credit' ? 'Credit (+)' :
                    transactionType === 'debit' ? 'Debit (-)' :
                      'Anamath'}
                </div>
                <div className={`text-xs ${transactionType === 'credit' ? 'text-emerald-600' :
                  transactionType === 'debit' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>
                  {transactionType === 'credit' ? 'Money coming in' :
                    transactionType === 'debit' ? 'Money going out' :
                      'Special entry'}
                </div>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label htmlFor="date" className="block text-xs font-medium text-gray-700">
              Date * <span className="text-gray-400">(Click to change)</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setValue('date', format(new Date(), 'yyyy-MM-dd'))}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setValue('date', format(yesterday, 'yyyy-MM-dd'));
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  const lastWeek = new Date();
                  lastWeek.setDate(lastWeek.getDate() - 7);
                  setValue('date', format(lastWeek, 'yyyy-MM-dd'));
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Last Week
              </button>
            </div>
            <input
              {...register('date')}
              type="date"
              id="date"
              className={`mt-1 input-field text-sm p-2 ${errors.date ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              title="Click to select a different date"
            />
            {errors.date && (
              <p className="text-xs text-red-600">{errors.date?.message}</p>
            )}
          </div>

          {/* Ledger Selection - Hidden for Anamath */}
          {transactionType !== 'anamath' && (
            <div className="space-y-1">
              <label htmlFor="ledgerId" className="block text-xs font-medium text-gray-700">
                Select Ledger *
              </label>
              <div className="relative">
                <select
                  id="ledgerId"
                  {...register('ledgerId')}
                  className={`input-field text-sm p-2 pl-9 pr-8 appearance-none bg-white ${errors.ledgerId ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  required={transactionType === 'debit' || transactionType === 'credit'}
                >
                  <option value="">Select Ledger</option>
                  {ledgers.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.ledgerId && (
                <p className="text-xs text-red-600">{errors.ledgerId?.message}</p>
              )}
              {/* Balance display removed - not needed for Credit/Debit transaction creation */}
            </div>
          )}

          {/* Transaction ID - Auto-generated readonly field for Credit/Debit */}
          {transactionType !== 'anamath' && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Transaction ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loadingTransactionNumber ? 'Loading...' : nextTransactionNumber ? `T${String(nextTransactionNumber).padStart(2, '0')}` : 'Auto'}
                  className="input-field text-sm p-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                  readOnly
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <span className="text-xs text-gray-400 mr-1">Auto</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {nextTransactionNumber ? `Next: T${String(nextTransactionNumber).padStart(2, '0')}` : 'Auto-generated'}
              </p>
            </div>
          )}

          {/* Anamath ID - Auto-generated readonly field for Anamath */}
          {transactionType === 'anamath' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Anamath ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value="A + Auto-generated number"
                  className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
                  readOnly
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-xs text-gray-400">Auto</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {nextAnamathId ? `Next available anamath ID: ${nextAnamathId}` : 'A unique anamath ID (A001, A002, etc.) will be assigned automatically'}
              </p>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1">
            <label htmlFor="amount" className="block text-xs font-medium text-gray-700">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold">₹</span>
              <input
                type="text"
                value={displayAmount}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Remove non-numeric characters except commas and dots
                  const cleanValue = inputValue.replace(/[^0-9.,]/g, '');

                  // Parse the cleaned value to get actual number
                  const numericValue = parseIndianNumber(cleanValue);

                  // Format for display (without decimals for whole numbers)
                  const hasDecimal = cleanValue.includes('.');
                  const formattedValue = hasDecimal
                    ? cleanValue // Keep user's decimal input as-is while typing
                    : formatIndianNumber(numericValue, false);

                  setDisplayAmount(formattedValue);
                  setValue('amount', numericValue);
                  clearErrors('amount');
                }}
                onBlur={() => {
                  // On blur, ensure proper formatting
                  const formatted = formatIndianNumber(watchedAmount, false);
                  setDisplayAmount(formatted);
                }}
                className={`w-full p-2 rounded border shadow-sm focus:ring-1 pl-8 text-lg font-medium ${errors.amount
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                placeholder=""
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-600">{errors.amount?.message}</p>
            )}
          </div>


          {/* Remarks - Only for Credit/Debit */}
          {(transactionType === 'credit' || transactionType === 'debit') && (
            <div className="space-y-1">
              <label htmlFor="remarks" className="block text-xs font-medium text-gray-700">
                Remarks (Optional)
              </label>
              <input
                {...register('remarks')}
                type="text"
                className="input-field text-sm p-2"
                placeholder=""
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {/* Combined Save Options - Only for Credit transactions */}
            {transactionType === 'credit' && (
              <div className="space-y-2">
                <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-gray-600">Credit TX #:</div>
                    <div className="font-mono text-right">
                      {loadingTransactionNumber ? '...' : (nextTransactionNumber ? `T${String(nextTransactionNumber).padStart(2, '0')}` : '—')}
                    </div>
                    <div className="text-gray-600">Anamath ID:</div>
                    <div className="font-mono text-right">
                      {loadingAnamathId ? '...' : (nextAnamathId || '—')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSubmit(data => onSubmit(data, 'withAnamath'))()}
                    disabled={isFormSubmitting}
                    className={`flex-1 flex items-center justify-center py-1.5 px-3 border border-transparent rounded text-xs font-medium text-white ${isFormSubmitting
                      ? 'bg-indigo-400'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                  >
                    <Save className="w-3 h-3 mr-1.5" />
                    Save + Anamath
                  </button>
                  <div className="text-xs text-gray-500">or</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(data => onSubmit(data, 'single'))()}
                disabled={isFormSubmitting}
                className={`px-4 py-1.5 border border-transparent rounded text-xs font-medium text-white ${isFormSubmitting
                  ? 'bg-indigo-400'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {isFormSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-3 h-3 mr-1.5" />
                    {transactionType === 'anamath' ? 'Save' : `Save ${transactionType}`}
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateTransaction;
