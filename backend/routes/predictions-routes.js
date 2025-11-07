const express = require('express');
const router = express.Router();

// Middleware imports
const { authMiddleware, checkRole, logAuthenticatedRequest } = require('../middleware/auth');

// Controller import
const { predecirDemanda } = require('../controllers/predictions-controller');  // Función que integra ML

// Middleware global
router.use(authMiddleware);
router.use(logAuthenticatedRequest);

// Generar predicciones: Solo admin o analista (para decisiones estratégicas)
router.post('/', checkRole(['admin', 'analista']), predecirDemanda);  // POST con body {productoId, dias: 30}

module.exports = router;