const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const {
    getPredictions,
    getTrends
} = require('../controllers/predictionsController');

// Todas las rutas requieren autenticación
//router.use(authMiddleware);

// GET /api/predictions - Obtener predicciones de demanda
router.get('/', getPredictions);

// GET /api/predictions/trends - Obtener tendencias
router.get('/trends', getTrends);

module.exports = router;