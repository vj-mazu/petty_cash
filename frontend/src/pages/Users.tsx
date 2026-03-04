import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi, User } from '../services/api';
import { Users as UsersIcon, Plus, Shield, X, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import { isAdmin } from '../utils/permissions';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'staff' as 'admin' | 'manager' | 'staff'
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getAllUsers({ limit: 100 });
      if (response.success) { setUsers(response.data.users || []); }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally { setLoading(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast.error('Username and password are required');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setCreating(true);
      const autoEmail = `${newUser.username.toLowerCase().replace(/\s+/g, '')}@petticash.local`;
      const response = await authApi.register({
        username: newUser.username,
        email: autoEmail,
        password: newUser.password,
        role: newUser.role
      });
      if (response.success) {
        toast.success(`User "${newUser.username}" created successfully`);
        setShowCreateForm(false);
        setNewUser({ username: '', password: '', role: 'staff' });
        setShowPassword(false);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally { setCreating(false); }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner message="Loading users..." />;

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UsersIcon className="w-5 h-5 mr-2" />
            <h1 className="text-xl font-bold">User Management</h1>
            <span className="ml-3 text-xs text-blue-200">{users.length} users</span>
          </div>
          {isAdmin(currentUser?.role) && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center px-3 py-1.5 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
            >
              {showCreateForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {showCreateForm ? 'Cancel' : 'Create User'}
            </button>
          )}
        </div>
      </div>

      {/* Vertical Create User Form - App-like feel */}
      {showCreateForm && isAdmin(currentUser?.role) && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-md mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <h3 className="text-white font-semibold flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Create New User
            </h3>
            <p className="text-blue-100 text-xs mt-1">Fill in the details below</p>
          </div>
          <form onSubmit={handleCreateUser} className="p-5 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required minLength={3} maxLength={30}
                placeholder="Enter username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required minLength={6}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['staff', 'manager', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setNewUser({ ...newUser, role })}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all capitalize ${newUser.role === role
                        ? role === 'admin'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : role === 'manager'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={creating || !newUser.username || !newUser.password}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* Excel-style Users Table */}
      <div className="overflow-x-auto shadow-xl rounded-lg border-2 border-gray-300 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-1.5 py-1 text-center w-10 bg-gray-100 font-bold text-xs">SL</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center bg-blue-100 font-bold text-xs">USERNAME</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center w-24 bg-yellow-100 font-bold text-xs">ROLE</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center w-20 bg-green-100 font-bold text-xs">STATUS</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center w-24 bg-orange-100 font-bold text-xs">LAST LOGIN</th>
              <th className="border border-gray-400 px-1.5 py-1 text-center w-24 bg-indigo-100 font-bold text-xs">JOINED</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((user, index) => (
              <tr
                key={user.id}
                className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">{index + 1}</td>
                <td className="border border-gray-300 px-1.5 py-1 text-center text-xs font-medium">
                  {user.username}
                  {user.id === currentUser?.id && (
                    <span className="ml-1 text-[10px] text-blue-600 font-bold">(You)</span>
                  )}
                </td>
                <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getRoleBadgeColor(user.role)}`}>
                    <Shield className="w-2.5 h-2.5 mr-0.5" />
                    {user.role}
                  </span>
                </td>
                <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                  {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yy') : 'Never'}
                </td>
                <td className="border border-gray-300 px-1.5 py-1 text-center text-xs">
                  {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yy') : 'N/A'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-4 py-6 text-center text-gray-500 text-sm">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;