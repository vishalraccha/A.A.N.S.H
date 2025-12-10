// API Configuration
export const API_CONFIG = {
  // Change this based on your environment
  BASE_URL: __DEV__ 
    ? 'http://localhost:5000'  // Development
    : 'https://your-production-url.com', // Production
  
  TIMEOUT: 30000, // 30 seconds
  
  ENDPOINTS: {
    RUN_COMMAND: '/runCommand',
  },
};

export default API_CONFIG;