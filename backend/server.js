const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Importar rutas
const auth_routes = require('./routes/auth-routes');
const inventory_routes = require('./routes/inventory-routes');
const sales_routes = require('./routes/sales-routes');
const predictions_routes = require('./routes/predictions-routes');

// Usar rutas
app.use('/api/auth', auth_routes);
app.use('/api/inventory', inventory_routes);
app.use('/api/sales', sales_routes);
app.use('/api/predictions', predictions_routes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente!' });
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
