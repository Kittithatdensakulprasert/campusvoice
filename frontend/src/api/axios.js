import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — enhanced error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject({
        ...error,
        userMessage: 'กรุณากรอกใหนระบบอีกครั้ง กรุณาเข้าใช้งานใหม่'
      });
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject({
        ...error,
        userMessage: 'คุณไม่มีสิทธิในการเข้าถึงหน้านี้'
      });
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject({
        ...error,
        userMessage: 'ไม่พบข้อมูลที่คุณต้องการ'
      });
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      return Promise.reject({
        ...error,
        userMessage: 'เซิร์เวอร์เซอร์เวอร์ กรุณาลอดใหม่'
      });
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        ...error,
        userMessage: 'การเชื่อมต่อถูกยุด กรุณาลอดใหม่'
      });
    }

    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_INTERNET_DISCONNECTED') {
      return Promise.reject({
        ...error,
        userMessage: 'ไม่สามารถเชื่อมต่อเซอร์เวอร์ กรุณาตรวจสอบการเน็ต'
      });
    }

    return Promise.reject(error);
  }
);

export default api;
