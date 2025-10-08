import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Crear instancia de axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Servicios de autenticación
export const authService = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

// Servicios de inventario
export const inventoryService = {
    getProducts: () => api.get('/inventory'),
    getProductById: (id) => api.get(`/inventory/${id}`),
    createProduct: (product) => api.post('/inventory', product),
    updateProduct: (id, product) => api.put(`/inventory/${id}`, product),
    deleteProduct: (id) => api.delete(`/inventory/${id}`),
    getAlerts: () => api.get('/inventory/alerts')
};

// Servicios de ventas
export const salesService = {
    getSales: () => api.get('/sales'),
    getSaleById: (id) => api.get(`/sales/${id}`),
    createSale: (sale) => api.post('/sales', sale),
    getSalesReport: (startDate, endDate) => {
        let url = '/sales/report';
        if (startDate || endDate) {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            url += `?${params.toString()}`;
        }
        return api.get(url);
    }
};

// Servicios de predicciones
export const predictionsService = {
    getPredictions: (productId, days) => {
        let url = '/predictions';
        if (productId || days) {
            const params = new URLSearchParams();
            if (productId) params.append('productId', productId);
            if (days) params.append('days', days);
            url += `?${params.toString()}`;
        }
        return api.get(url);
    },
    getTrends: () => api.get('/predictions/trends')
};

export default api;