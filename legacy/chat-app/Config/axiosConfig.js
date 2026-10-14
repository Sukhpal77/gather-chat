import axios from 'axios';
import API_URL from '../predefineVar';

// Create an Axios instance
const axiosInstance = axios.create({
    baseURL: 'http://192.168.1.50:5000/api', // Replace with your API base URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to refresh the token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (token) {
            prom.resolve(token);
        } else {
            prom.reject(error);
        }
    });

    failedQueue = [];
};

// Request interceptor to add the authorization header
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    response => {
        return response;
    },
    async error => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(`http://${API_URL}:5000/auth/refresh`, { refreshToken });

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
                processQueue(null, accessToken);

                return axiosInstance(originalRequest);
            } catch (err) {
                processQueue(err, null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
