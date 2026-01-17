import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
};

export const register = async (username, password) => {
    const res = await api.post('/auth/register', { username, password });
    return res.data;
};

export const getProvinces = async () => {
    const res = await api.get('/mgm/provinces');
    return res.data;
};

export const getCenters = async (il) => {
    const res = await api.get('/mgm/centers', { params: { il } });
    return res.data;
};

export const getAnalysis = async (stationId) => {
    const res = await api.get('/mgm/analysis', { params: { stationId } });
    return res.data;
};

export default api;
