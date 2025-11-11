import axios from "axios"

const API_URL = "http://localhost:5000/api"

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// --- AUTENTICACIÓN ---
export const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },
  getCurrentUser: () => {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  },
}

// --- INVENTARIO ---
export const inventoryService = {
  // GET /api/inventory - Devuelve { success: true, data: [...] }
  getProducts: () => api.get("/inventory"),
  
  // GET /api/inventory/:id - Devuelve { success: true, data: {...} }
  getProductById: (id) => api.get(`/inventory/${id}`),
  
  // POST /api/inventory - Requiere: { nombre, codigo_sku, categoria, precio_venta, stock_actual, stock_minimo, proveedor }
  createProduct: (product) => {
    const payload = {
      nombre: product.name,
      codigo_sku: product.sku,
      categoria: product.category || "general",
      precio_venta: parseFloat(product.price),
      stock_actual: parseInt(product.stock),
      stock_minimo: parseInt(product.minStock),
      proveedor: product.supplier || ""
    }
    return api.post("/inventory", payload)
  },
  
  // PUT /api/inventory/:id - Actualiza producto
  updateProduct: (id, product) => {
    const payload = {
      nombre: product.name,
      codigo_sku: product.sku,
      categoria: product.category || "general",
      precio_venta: parseFloat(product.price),
      stock_actual: parseInt(product.stock),
      stock_minimo: parseInt(product.minStock),
      proveedor: product.supplier || ""
    }
    return api.put(`/inventory/${id}`, payload)
  },
  
  // DELETE /api/inventory/:id - Soft delete
  deleteProduct: (id) => api.delete(`/inventory/${id}`),
  
  // GET /api/inventory/alerts/low-stock - Devuelve { success: true, data: [...] }
  getAlerts: () => api.get("/inventory/alerts/low-stock"),
}

// --- VENTAS ---
export const salesService = {
  // GET /api/sales - Solo admin - Devuelve { success: true, sales: [...] }
  getSales: () => api.get("/sales"),
  
  // GET /api/sales/:id - Solo admin
  getSaleById: (id) => api.get(`/sales/${id}`),
  
  // POST /api/sales - Requiere: { productId, quantity, discount, paymentMethod, isSeason }
  createSale: (sale) => {
    const payload = {
      productId: parseInt(sale.productId),
      quantity: parseInt(sale.quantity),
      discount: parseFloat(sale.discount || 0),
      paymentMethod: sale.paymentMethod || "efectivo",
      isSeason: sale.isSeason || false
    }
    return api.post("/sales", payload)
  },
}

// --- PREDICCIONES ---
export const predictionsService = {
  // GET /api/predictions/active - Devuelve { success: true, products: [...] }
  getProducts: () => api.get("/predictions/active"),
  
  // POST /api/predictions - Requiere: { productId, days }
  // Devuelve { success: true, prediction: [{...}] }
  getPredictions: (productId, days = 30) => {
    if (!productId) throw new Error("Debe proporcionar un productId válido")
    return api.post("/predictions", { 
      productId: parseInt(productId), 
      days: parseInt(days) 
    })
  },
  
  // GET /api/predictions/all - Devuelve { success: true, predictions: [...] }
  getAllPredictions: () => api.get("/predictions/all"),
}

// --- PROVEEDORES ---
export const providersService = {
  // GET /api/providers - Devuelve { success: true, providers: [...] }
  getProviders: () => api.get("/providers"),
}

export default api