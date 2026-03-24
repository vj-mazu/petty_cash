// Utility to clear all frontend cached data
const clearAllFrontendData = () => {
  try {
    console.log('🧹 Clearing all frontend cached data...');
    
    // Clear localStorage
    const keysToKeep = ['token', 'user']; // Keep authentication data
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
        console.log(`Removed localStorage key: ${key}`);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('Cleared sessionStorage');
    
    // Clear any cached API responses (if using cache)
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
      console.log('Cleared browser caches');
    }
    
    console.log('✅ Frontend data cleared successfully');
    console.log('Note: Authentication data (token, user) was preserved');
    
  } catch (error) {
    console.error('❌ Error clearing frontend data:', error);
  }
};

// Auto-run when this file is loaded
clearAllFrontendData();

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearAllFrontendData };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.clearAllFrontendData = clearAllFrontendData;
}