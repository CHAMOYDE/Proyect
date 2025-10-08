const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAlerts
} = require('../controllers/inventoryController');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/inventory - Obtener todos los productos
router.get('/', getProducts);

// GET /api/inventory/alerts - Obtener alertas
router.get('/alerts', getAlerts);

// GET /api/inventory/:id - Obtener un producto por ID
router.get('/:id', getProductById);

// POST /api/inventory - Crear producto (solo admin)
router.post('/', checkRole('admin'), createProduct);

// PUT /api/inventory/:id - Actualizar producto (solo admin)
router.put('/:id', checkRole('admin'), updateProduct);

// DELETE /api/inventory/:id - Eliminar producto (solo admin)
router.delete('/:id', checkRole('admin'), deleteProduct);

module.exports = router;