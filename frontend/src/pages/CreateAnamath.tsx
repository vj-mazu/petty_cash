import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { anamathApi, ledgerApi, Ledger } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toTitleCase } from '../utils/textUtils';

interface AnamathFormData {
  date: string;
  ledgerId: string;
  amount: number | string;
  remarks: string;
}

const CreateAnamath: React.FC = () => {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<AnamathFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    ledgerId: '',
    amount: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Partial<AnamathFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        setLoading(true);
        const response = await ledgerApi.getAll({ limit: 100 });
        if (response.success) {
          setLedgers(response.data.ledgers);
        }
      } catch (error) {
        console.error('Error fetching ledgers:', error);
        toast.error('Failed to load ledgers');
      } finally {
        setLoading(false);
      }
    };
    fetchLedgers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let newValue;
      if (name === 'amount') {
        newValue = value === '' ? 0 : parseFloat(value) || 0;
      } else if (name === 'remarks') {
        newValue = toTitleCase(value);
      } else {
        newValue = value;
      }
      return { ...prev, [name]: newValue };
    });
    if (errors[name as keyof AnamathFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AnamathFormData> = {};
    if (!formData.ledgerId) newErrors.ledgerId = 'Please select a ledger';
    const amountValue = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount;
    if (!amountValue || amountValue <= 0) newErrors.amount = 'Please enter a valid amount';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) || 0 : formData.amount;
      const response = await anamathApi.create({
        date: formData.date,
        ledgerId: formData.ledgerId,
        amount,
        remarks: toTitleCase(formData.remarks)
      });
      if (response.success) {
        toast.success('Anamath entry created successfully');
        navigate('/anamath', { state: { refresh: true } });
      } else {
        throw new Error(response.message || 'Failed to create Anamath entry');
      }
    } catch (error: any) {
      console.error('Error creating Anamath entry:', error);
      toast.error(error.response?.data?.message || 'Failed to create Anamath entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading ledgers..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header - Matching Transaction Create style */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/anamath')}
              className="p-1.5 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Add Anamath Entry</h1>
              <p className="text-blue-100 text-sm mt-0.5">Record a special entry</p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Form - Same style as Credit/Debit */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Ledger */}
            <div>
              <label htmlFor="ledgerId" className="block text-xs font-medium text-gray-700 mb-1">
                Ledger <span className="text-red-500">*</span>
              </label>
              <select
                id="ledgerId"
                name="ledgerId"
                value={formData.ledgerId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.ledgerId ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Select ledger</option>
                {ledgers.map(ledger => (
                  <option key={ledger.id} value={ledger.id}>{ledger.name}</option>
                ))}
              </select>
              {errors.ledgerId && <p className="mt-0.5 text-xs text-red-600">{errors.ledgerId}</p>}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-xs font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full pl-7 px-3 py-2 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="mt-0.5 text-xs text-red-600">{errors.amount}</p>}
            </div>

            {/* Remarks */}
            <div>
              <label htmlFor="remarks" className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter remarks"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/anamath')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Anamath
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateAnamath;
