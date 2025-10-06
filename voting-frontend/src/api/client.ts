import axios from 'axios';
import { ENV } from '../lib/env';

export const api = axios.create({
    baseURL: ENV.API_BASE_URL,
    timeout: 15000,
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error('API error:', err?.response?.data ?? err.message);
        return Promise.reject(err);
    }
);
