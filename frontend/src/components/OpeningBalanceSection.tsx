import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatIndianCurrency, formatDisplayAmount } from '../utils/indianNumberFormat';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  BarChart3,
  RefreshCw,
  Info,
  History
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'react-toastify';
import { openingBalanceApi, OpeningBalance, OpeningBalanceSummary } from '../services/api';
import { useOpeningBalance, useBalanceHistory } from '../hooks/useOpeningBalance';
import LoadingSpinner from './LoadingSpinner';

interface OpeningBalanceSectionProps {
  className?: string;
  showHistory?: boolean;
  onManualBalanceSet?: (ledgerId: string, amount: number) => void;
}

const OpeningBalanceSection: React.FC<OpeningBalanceSectionProps> = ({ 
  className = '', 
  showHistory = true,
  onManualBalanceSet
}) => {
  const [showManualAdjustment, setShowManualAdjustment] = useState(false);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  
  // Use the custom hook for opening balance management
  const {
    summary,
    currentBalances,
    loading,
    refreshData,
    setManualBalance
  } = useOpeningBalance();
  
  // Get balance history for the first ledger if available
  const firstLedgerId = currentBalances.length > 0 ? currentBalances[0].ledgerId : undefined;
  const { history: balanceHistory } = useBalanceHistory(
    showHistory ? firstLedgerId : undefined, 
    7
  );

  const handleRefresh = async () => {
    await refreshData();
  };

  const handleManualAdjustment = async () => {
    if (!selectedLedgerId || !manualAmount) {
      toast.error('Please select a ledger and enter an amount');
      return;
    }

    const amount = parseFloat(manualAmount);
    if (isNaN(amount)) {
      toast.error('Please enter a valid amount');
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const success = await setManualBalance(
      selectedLedgerId, 
      today, 
      amount, 
      'Manual adjustment from dashboard'
    );

    if (success) {
      setShowManualAdjustment(false);
      setSelectedLedgerId('');
      setManualAmount('');
      
      // Call the callback if provided
      if (onManualBalanceSet) {
        onManualBalanceSet(selectedLedgerId, amount);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return formatIndianCurrency(amount);
  };

  const getBalanceChangeColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceChangeIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="w-4 h-4" />;
    if (amount < 0) return <TrendingDown className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <LoadingSpinner message="Loading opening balance data..." />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calculator className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Opening Balance</h2>
            <p className="text-sm text-gray-600">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </motion.button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Opening Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Opening Balance</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(summary.totalOpeningBalance)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </motion.div>

          {/* Current Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Current Balance</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(summary.totalClosingBalance)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </motion.div>

          {/* Total Credits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Today's Credits</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(summary.totalCredits)}
                </p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          {/* Total Debits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Today's Debits</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(summary.totalDebits)}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Balance Calculation Formula */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"
        >
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">Balance Calculation</h3>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-lg">
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium">Opening Balance</div>
              <div className="text-xl font-bold text-blue-900">
                {formatCurrency(summary.totalOpeningBalance)}
              </div>
            </div>
            
            <div className="text-2xl font-bold text-gray-400">+</div>
            
            <div className="text-center">
              <div className="text-sm text-green-600 font-medium">Credits</div>
              <div className="text-xl font-bold text-green-900">
                {formatCurrency(summary.totalCredits)}
              </div>
            </div>
            
            <div className="text-2xl font-bold text-gray-400">-</div>
            
            <div className="text-center">
              <div className="text-sm text-red-600 font-medium">Debits</div>
              <div className="text-xl font-bold text-red-900">
                {formatCurrency(summary.totalDebits)}
              </div>
            </div>
            
            <div className="text-2xl font-bold text-gray-400">=</div>
            
            <div className="text-center">
              <div className="text-sm text-purple-600 font-medium">Current Balance</div>
              <div className="text-xl font-bold text-purple-900">
                {formatCurrency(summary.totalClosingBalance)}
              </div>
            </div>
          </div>

          {/* Net Change */}
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Net Change:</span>
              <div className={`flex items-center space-x-1 ${getBalanceChangeColor(summary.netChange)}`}>
                {getBalanceChangeIcon(summary.netChange)}
                <span className="font-bold">
                  {summary.netChange >= 0 ? '+' : ''}{formatCurrency(summary.netChange)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Day Ledger Balances */}
      {currentBalances.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Today's Ledger Balances</h3>
              <span className="text-sm text-gray-500">({currentBalances.length} ledgers)</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowManualAdjustment(!showManualAdjustment)}
              className="px-3 py-1 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors duration-200"
            >
              Manual Adjustment
            </motion.button>
          </div>
          
          <div className="space-y-3">
            {currentBalances.map((balance) => (
              <div
                key={balance.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {balance.ledger?.name || 'Unknown Ledger'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Credits: {formatCurrency(balance.totalCredits)} | 
                    Debits: {formatCurrency(balance.totalDebits)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Opening</div>
                  <div className="font-bold text-gray-900">
                    {formatCurrency(balance.openingAmount)}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm text-gray-500">Current</div>
                  <div className="font-bold text-gray-900">
                    {formatCurrency(balance.closingAmount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Balance History for Last 7 Days */}
      {showHistory && balanceHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Balance History</h3>
            <span className="text-sm text-gray-500">(Last 7 days)</span>
          </div>
          
          <div className="space-y-2">
            {balanceHistory.slice(0, 7).map((balance, index) => {
              const isToday = format(new Date(balance.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const dayChange = index > 0 ? balance.closingAmount - balanceHistory[index - 1].closingAmount : 0;
              
              return (
                <div
                  key={balance.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    isToday 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    <div>
                      <div className={`font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                        {format(new Date(balance.date), 'EEE, MMM d')}
                        {isToday && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Today</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        +{formatCurrency(balance.totalCredits)} / -{formatCurrency(balance.totalDebits)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                      {formatCurrency(balance.closingAmount)}
                    </div>
                    {index > 0 && (
                      <div className={`text-xs flex items-center justify-end space-x-1 ${getBalanceChangeColor(dayChange)}`}>
                        {getBalanceChangeIcon(dayChange)}
                        <span>{dayChange >= 0 ? '+' : ''}{formatCurrency(dayChange)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Manual Balance Adjustment */}
      {showManualAdjustment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-yellow-50 border-yellow-200"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Calculator className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-900">Manual Balance Adjustment</h3>
          </div>
          
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important:</p>
                <p>Manual adjustments will create an audit trail entry and override automatic calculations for the selected date.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Ledger
              </label>
              <select 
                value={selectedLedgerId}
                onChange={(e) => setSelectedLedgerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Choose ledger...</option>
                {currentBalances.map((balance) => (
                  <option key={balance.ledgerId} value={balance.ledgerId}>
                    {balance.ledger?.name || 'Unknown Ledger'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Opening Balance
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManualAdjustment}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                Apply Adjustment
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Information Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="card p-4 bg-blue-50 border-blue-200"
      >
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Opening Balance Information</p>
            <p>
              Opening balances are automatically calculated based on the previous day's closing balance. 
              Anamath entries do not affect balance calculations and are maintained separately for audit purposes.
              Manual adjustments create audit trail entries for compliance tracking.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OpeningBalanceSection;