const sql = require('mssql');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: false }
};

// Configuración de acción
const accion = 'crear'; // 'crear' | 'listar' | 'eliminar'

// Datos del usuario (solo si accion = 'crear')
const nuevoUsuario = {
  nombre: 'Administrador General',
  correo: 'admin@empresa.local',
  passwordPlain: 'Admin123',
  rol: 'admin'
};

// Datos para eliminar (solo si accion = 'eliminar')
const correoEliminar = 'vendedor@empresa.local';

async function main() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Conectado a Azure SQL.');

    switch (accion) {
      case 'crear':
        await crearUsuario(pool, nuevoUsuario);
        break;
      case 'listar':
        await listarUsuarios(pool);
        break;
      case 'eliminar':
        await eliminarUsuario(pool, correoEliminar);
        break;
      default:
        console.log('Acción no válida. Usa "crear", "listar" o "eliminar".');
    }

  } catch (err) {
    console.error('Error general:', err.message);
  } finally {
    if (pool) await pool.close();
    console.log('Conexión cerrada.');
  }
}

async function crearUsuario(pool, { nombre, correo, passwordPlain, rol }) {
  const existing = await pool.request()
    .input('correo', sql.VarChar, correo)
    .query('SELECT id FROM usuarios WHERE correo = @correo');

  if (existing.recordset.length > 0) {
    console.log(`El usuario ${correo} ya existe.`);
    return;
  }

  const hashed = await bcrypt.hash(passwordPlain, 10);

  await pool.request()
    .input('nombre', sql.VarChar, nombre)
    .input('correo', sql.VarChar, correo)
    .input('password', sql.VarChar, hashed)
    .input('rol', sql.VarChar, rol)
    .query(`
      INSERT INTO usuarios (nombre, correo, password, rol)
      VALUES (@nombre, @correo, @password, @rol)
    `);

  console.log(`Usuario creado: ${correo} (rol: ${rol})`);
}

async function listarUsuarios(pool) {
  const res = await pool.request().query('SELECT id, nombre, correo, rol, creado_en FROM usuarios');
  console.table(res.recordset);
}

async function eliminarUsuario(pool, correo) {
  const res = await pool.request()
    .input('correo', sql.VarChar, correo)
    .query('DELETE FROM usuarios WHERE correo = @correo');
  
  if (res.rowsAffected[0] > 0) {
    console.log(`Usuario eliminado: ${correo}`);
  } else {
    console.log(`No se encontró usuario con correo: ${correo}`);
  }
}

main();
