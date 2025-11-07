const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { 
    encrypt: true, 
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

async function ejecutarScript() {
  const filePath = path.join(__dirname, 'create-schema.sql');

  if (!fs.existsSync(filePath)) {
    console.error('Error: No se encontró create-schema.sql');
    process.exit(1);
  }

  console.log('Leyendo archivo SQL...');
  const script = fs.readFileSync(filePath, 'utf8');

  let pool;
  try {
    console.log('Conectando a Azure SQL...');
    pool = await sql.connect(config);
    console.log('Conexion establecida');

    console.log('Ejecutando script...');
    await pool.request().batch(script);

    console.log('Script ejecutado correctamente');

    const verificacion = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'inventario'
      ORDER BY TABLE_NAME;
    `);

    console.log('Tablas creadas:', verificacion.recordset.length);
    verificacion.recordset.forEach(row => {
      console.log('  - inventario.' + row.TABLE_NAME);
    });

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
    console.log('Conexion cerrada');
  }
}

ejecutarScript();