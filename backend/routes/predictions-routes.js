const express = require('express');
const router = express.Router();
const { predecirDemanda } = require('../controllers/predictions-controller');

// Ruta para generar predicciones
router.post('/', predecirDemanda);

module.exports = router;
