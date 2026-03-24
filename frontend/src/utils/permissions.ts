/**
 * Permission utility functions for consistent role-based access control
 */

export type UserRole = 'admin' | 'manager' | 'staff';

/**
 * Check if user has admin privileges
 */
export const isAdmin = (role?: string): boolean => {
  return role === 'admin';
};

/**
 * Check if user has manager privileges
 */
export const isManager = (role?: string): boolean => {
  return role === 'manager';
};

/**
 * Check if user is staff only
 */
export const isStaff = (role?: string): boolean => {
  return role === 'staff';
};

/**
 * Check if user can create resources (Staff + Manager + Admin)
 */
export const canCreate = (role?: string): boolean => {
  return isAdmin(role) || isManager(role) || isStaff(role);
};

/**
 * Check if user can view resources (Staff + Manager + Admin)
 */
export const canView = (role?: string): boolean => {
  return isAdmin(role) || isManager(role) || isStaff(role);
};

/**
 * Check if user can edit resources (Admin, Manager, Staff)
 */
export const canEdit = (role?: string): boolean => {
  return isAdmin(role) || isManager(role) || isStaff(role);
};

/**
 * Check if user can delete resources (Admin only)
 */
export const canDelete = (role?: string): boolean => {
  return isAdmin(role);
};

/**
 * Check if user can approve debit transactions (Admin + Manager)
 */
export const canApproveDebit = (role?: string): boolean => {
  return isAdmin(role) || isManager(role);
};

/**
 * Check if user can approve credit transactions (Admin only)
 */
export const canApproveCredit = (role?: string): boolean => {
  return isAdmin(role);
};

/**
 * Check if user can export data (Staff + Manager + Admin)
 */
export const canExport = (role?: string): boolean => {
  return isAdmin(role) || isManager(role) || isStaff(role);
};

/**
 * Check if user can manage other users (Admin only)
 */
export const canManageUsers = (role?: string): boolean => {
  return isAdmin(role);
};

/**
 * Check if user can manage system settings (Admin only)
 */
export const canManageSystem = (role?: string): boolean => {
  return isAdmin(role);
};

/**
 * Check if user can manage opening balances (Admin only)
 */
export const canManageOpeningBalance = (role?: string): boolean => {
  return isAdmin(role);
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role?: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'staff':
      return 'Staff';
    default:
      return 'Unknown';
  }
};

/**
 * Get permission level for comparison (higher = more permissions)
 */
export const getPermissionLevel = (role?: string): number => {
  switch (role) {
    case 'admin':
      return 4;
    case 'manager':
      return 3;
    case 'staff':
      return 1;
    default:
      return 0;
  }
};