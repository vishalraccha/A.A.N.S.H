import axios from 'axios';

// Backend API base URL
const API_BASE_URL = 'http://10.202.153.140:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for long-running commands
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Send command to backend
 * @param {string} command - The command to execute
 * @returns {Promise} Response from backend
 */
export const sendCommandToBackend = async (command) => {
  try {
    const response = await apiClient.post('/runCommand', {
      command: command,
    });
    
    return response.data;
  } catch (error) {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      console.error('Backend Error:', error.response.data);
      throw error;
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error: No response from server');
      throw new Error('Network Error');
    } else {
      // Something else happened
      console.error('Error:', error.message);
      throw error;
    }
  }
};

// Optional: Add interceptors for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    return Promise.reject(error);
  }
);

export default apiClient;