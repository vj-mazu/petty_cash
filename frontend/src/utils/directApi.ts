/**
 * Direct API utility for testing purposes
 * This bypasses the normal authentication flow to test functionality
 */

const API_BASE_URL = 'http://localhost:5000/api';

interface DirectApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export const directApi = {
  // Get anamath record by ID with token
  getAnamathById: async (id: string): Promise<DirectApiResponse> => {
    try {
      console.log('🌐 Direct API call for anamath ID:', id);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log('🔑 Token found:', !!token);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/anamath-entries/${id}`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      return {
        success: response.ok && data.success,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error('🚨 Direct API error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Update anamath record
  updateAnamathById: async (id: string, updateData: any): Promise<DirectApiResponse> => {
    try {
      console.log('🌐 Direct API update for anamath ID:', id, 'with data:', updateData);
      
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('📤 Request headers:', headers);
      console.log('📤 Request body:', JSON.stringify(updateData));
      
      const response = await fetch(`${API_BASE_URL}/anamath-entries/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });
      
      console.log('📡 Update response status:', response.status);
      console.log('📡 Response status text:', response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📊 Update response data:', data);
      
      // Log authentication failure details
      if (response.status === 401) {
        console.error('🔒 AUTHENTICATION FAILED!');
        console.error('Token used:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        console.error('Response message:', data.message);
      }
      
      return {
        success: response.ok && data.success,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error('🚨 Direct API update error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Test token validity
  testToken: async (): Promise<DirectApiResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok && data.success,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Token test failed'
      };
    }
  }
};

export default directApi;