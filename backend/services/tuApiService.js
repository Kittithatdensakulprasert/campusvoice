const axios = require('axios');

class TuApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'TuApiError';
    this.statusCode = statusCode;
  }
}

const createTuApiService = ({
  apiKey = process.env.TU_API_KEY,
  axiosLib = axios
} = {}) => {
  if (!apiKey) {
    throw new Error('TU_API_KEY is required');
  }

  // v1 for authentication
  const v1Client = axiosLib.create({
    baseURL: 'https://restapi.tu.ac.th/api/v1',
    headers: {
      'Application-Key': apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  // v2 for student info
  const v2Client = axiosLib.create({
    baseURL: 'https://restapi.tu.ac.th/api/v2',
    headers: {
      'Application-Key': apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  const authenticate = async (username, password) => {
    try {
      console.log('TU API Auth - Username:', username);
      const response = await v1Client.post('/auth/Ad/verify', {
        UserName: username,
        PassWord: password
      });

      console.log('TU API Response:', response.data);

      if (!response.data.status) {
        throw new TuApiError('Authentication failed', 401);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;
        const message = error.response.data?.message || 'TU API authentication failed';
        console.log('TU API Error:', error.response.data);
        throw new TuApiError(message, statusCode);
      } else if (error instanceof TuApiError) {
        throw error;
      } else {
        throw new TuApiError('Failed to connect to TU API', 500);
      }
    }
  };

  const getStudentInfo = async (studentId) => {
    try {
      // Use v2 endpoint for student info
      const response = await v2Client.get(`/profile/std/info/?id=${studentId}`);

      if (!response.data.status) {
        throw new TuApiError('Student not found', 404);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;
        const message = error.response.data?.message || 'Failed to get student info';
        throw new TuApiError(message, statusCode);
      } else if (error instanceof TuApiError) {
        throw error;
      } else {
        throw new TuApiError('Failed to connect to TU API', 500);
      }
    }
  };

  return {
    authenticate,
    getStudentInfo
  };
};

module.exports = {
  TuApiError,
  createTuApiService
};
