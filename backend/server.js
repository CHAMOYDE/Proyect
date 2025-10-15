const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./data/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const predictionsRoutes = require('./routes/predictionsRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/predictions', predictionsRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'Backend funcionando correctamente!' });
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});