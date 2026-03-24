import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ledgerApi, type Ledger, type CreateLedgerData } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { toTitleCase } from '../utils/textUtils';

const EditLedger: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: '',
    description: ''
  });
  
  // Store the full ledger data for reference
  const [ledger, setLedger] = useState<Ledger | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If we're editing, fetch the specific ledger
        if (id) {
          console.log('Fetching ledger with ID:', id);
          const response = await ledgerApi.getById(id);
          console.log('Received ledger data:', response.data);
          
          if (response.success && response.data?.ledger) {
            const { name, description } = response.data.ledger;
            console.log('Setting form data with:', { name, description });
            
            setLedger(response.data.ledger);
            setFormData({
              name: name || '',
              description: description || ''
            });
          } else {
            throw new Error(response.message || 'Failed to load ledger');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load ledger data');
        navigate('/ledgers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ledger) return;
    
    try {
      setSaving(true);
      // Prepare the update data with proper types and title case formatting
      const updateData: Partial<CreateLedgerData> = {
        name: toTitleCase(formData.name.trim()),
        description: formData.description?.trim() ? toTitleCase(formData.description.trim()) : undefined
      };
      
      console.log('Updating ledger with data:', updateData);
      
      const response = await ledgerApi.update(id, updateData);
      
      if (response.success && response.data?.ledger) {
        console.log('Update successful, response:', response.data);
        toast.success('Ledger updated successfully');
        // Update the local state with the updated ledger data
        setLedger(response.data.ledger);
        // Navigate back after a short delay to show the success message
        setTimeout(() => navigate('/ledgers'), 1000);
      } else {
        throw new Error(response.message || 'Failed to update ledger');
      }
    } catch (error: any) {
      console.error('Error updating ledger:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update ledger';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <LoadingSpinner message="Loading ledger..." />;
  }


  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Ledger</h1>
        <p className="mt-1 text-sm text-gray-600">Update the details of this ledger account.</p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Ledger Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Ledger Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="Enter ledger name"
            />
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="Enter any additional details or reference information"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.description ? `${formData.description.length}/500 characters` : 'Optional: Add any reference or important notes about this ledger'}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/ledgers')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
};

export default EditLedger;