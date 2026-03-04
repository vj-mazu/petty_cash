import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { OpeningBalanceProvider } from './contexts/OpeningBalanceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Pages
import Login from './pages/Login';
import SimpleLogin from './pages/SimpleLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Ledgers from './pages/Ledgers';
import LedgersView from './pages/LedgersView';
import CreateLedger from './pages/CreateLedger';
import EditLedger from './pages/EditLedger';
import Transactions from './pages/Transactions';
import TransactionsWithRunningBalance from './pages/TransactionsWithRunningBalance';
import CreateTransaction from './pages/CreateTransaction';
import CreateAnamath from './pages/CreateAnamath';
import ClosedAnamathRecords from './pages/ClosedAnamathRecords';

import { CreditTransactionForm, DebitTransactionForm, CombinedTransactionForm } from './components/transactions';
import TransactionFilters from './pages/TransactionFilters';
import Users from './pages/Users';
import Settings from './pages/Settings';
import OpeningBalance from './pages/OpeningBalance';
import Anamath from './pages/Anamath';
import AnamathFilters from './pages/AnamathFilters';
import EditAnamath from './pages/EditAnamath';
import TransactionTypeSelection from './pages/TransactionTypeSelection';
import HighPerformanceTransactionList from './pages/HighPerformanceTransactionList';
import LightningFastTransactionList from './pages/LightningFastTransactionList';

// Records component removed

function App() {
  return (
    <AuthProvider>
      <OpeningBalanceProvider>
        <Router>
          <AppWithShortcuts />
        </Router>
      </OpeningBalanceProvider>
    </AuthProvider>
  );
}

function AppWithShortcuts() {
  // Enable keyboard shortcuts globally
  useKeyboardShortcuts();

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/simple-login" element={<SimpleLogin />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="ledgers" element={<Ledgers />} />
          <Route path="ledgers-view" element={<LedgersView />} />
          <Route path="ledgers/create" element={<CreateLedger />} />
          <Route path="ledgers/:id/edit" element={
            <ProtectedRoute requiredRole="admin">
              <EditLedger />
            </ProtectedRoute>
          } />

          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/fast" element={
            <React.Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
              {React.createElement(React.lazy(() => import('./pages/FastTransactionList')))}
            </React.Suspense>
          } />
          <Route path="transactions/high-performance" element={<HighPerformanceTransactionList />} />
          <Route path="transactions/lightning" element={<LightningFastTransactionList />} />
          <Route path="transactions/with-running-balance" element={<TransactionsWithRunningBalance />} />
          <Route path="transactions/create" element={<TransactionTypeSelection />} />
          <Route path="transactions/create/credit" element={<CreateTransaction type="credit" />} />
          <Route path="transactions/create/debit" element={<CreateTransaction type="debit" />} />
          <Route path="transactions/create/anamath" element={<CreateAnamath />} />
          <Route path="transactions/create/combined" element={<CombinedTransactionForm />} />
          <Route path="transactions/filters" element={<TransactionFilters />} />
          <Route path="transactions/anamath" element={<Anamath />} />

          {/* PDF Export Test Page */}


          <Route path="users" element={
            <ProtectedRoute requiredRole="admin">
              <Users />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute requiredRole="admin">
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="opening-balance" element={
            <ProtectedRoute openingBalanceAccess={true}>
              <OpeningBalance />
            </ProtectedRoute>
          } />
          <Route path="anamath" element={<Anamath />} />
          <Route path="anamath/closed" element={<ClosedAnamathRecords />} />
          <Route path="anamath-filters" element={<AnamathFilters />} />
          <Route path="anamath/:id/edit" element={<EditAnamath />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;