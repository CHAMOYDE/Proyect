// Configuración de conexión a Azure SQL
const sql = require("mssql")
require("dotenv").config()

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

// Crear y conectar el pool
const pool = new sql.ConnectionPool(config)

pool
  .connect()
  .then(() => console.log("[DB] Conectado a Azure SQL"))
  .catch((err) => console.error("[DB] Error de conexión:", err.message))

module.exports = pool
