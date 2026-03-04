import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { TransactionActionButtons } from '../components/transactions';

const TransactionTypeSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleCreditClick = () => {
    console.log('Credit button clicked, navigating to /transactions/create/credit');
    navigate('/transactions/create/credit');
  };

  const handleDebitClick = () => {
    console.log('Debit button clicked, navigating to /transactions/create/debit');
    navigate('/transactions/create/debit');
  };

  const handleAnamathClick = () => {
    console.log('Anamath button clicked, navigating to /transactions/create/anamath');
    navigate('/transactions/create/anamath');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/transactions')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Transaction</h1>
          <p className="text-gray-600 mt-1">Choose the type of transaction you want to record</p>
        </div>
      </div>

      {/* Transaction Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card p-8"
      >
        <TransactionActionButtons
          onCreditClick={handleCreditClick}
          onDebitClick={handleDebitClick}
          onAnamathClick={handleAnamathClick}
        />
      </motion.div>

      {/* Information Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Credit Info */}
        <div className="card p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <h3 className="text-lg font-semibold text-emerald-900 mb-3">
            💰 Credit Transactions
          </h3>
        </div>

        {/* Debit Info */}
        <div className="card p-6 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-3">
            💸 Debit Transactions
          </h3>
        </div>

        {/* Anamath Info */}
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📝 Anamath Entries
          </h3>
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionTypeSelection;