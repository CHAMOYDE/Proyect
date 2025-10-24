const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const {
    getSales,
    getSaleById,
    createSale,
    getSalesReport
} = require('../controllers/sales-controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/sales - Obtener todas las ventas
router.get('/', getSales);

// GET /api/sales/report - Obtener reporte de ventas
router.get('/report', getSalesReport);

// GET /api/sales/:id - Obtener una venta por ID
router.get('/:id', getSaleById);

// POST /api/sales - Registrar nueva venta
router.post('/', createSale);

module.exports = router;