const express = require('express'); 
const router = express.Router();

// Middleware imports
const { authMiddleware, checkRole } = require('../middleware/auth');

// Controller import
const { predecirDemanda, getActiveProducts, getAllPredictions } = require('../controllers/predictions-controller');

// Middleware global: autenticación
router.use(authMiddleware);

// Generar predicciones (solo admin o analista)
router.post('/', checkRole('administrador', 'analista'), predecirDemanda);

// Obtener predicciones activas (para selector de productos)
router.get('/active', getActiveProducts);

// Obtener predicciones de todos los productos
router.get('/all', getAllPredictions);

module.exports = router;
