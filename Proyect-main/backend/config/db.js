const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,              // Requerido por Azure
        trustServerCertificate: false // Seguridad activa
    }
};

const pool = new sql.ConnectionPool(config);

pool.connect()
    .then(() => console.log('Conectado correctamente a Azure SQL'))
    .catch(err => console.error('Error al conectar con Azure SQL:', err.message));

module.exports = pool;
