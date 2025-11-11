// config/db.js
const sql = require("mssql");

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
};

let pool;

const connectDB = async () => {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log("Conectado correctamente a Azure SQL");
    } catch (err) {
      console.error("Error conexión:", err);
      throw err;
    }
  }
  return pool;
};

const getPool = () => {
  if (!pool) throw new Error("No hay conexión activa a la base de datos");
  return pool;
};

module.exports = { sql, connectDB, getPool };
