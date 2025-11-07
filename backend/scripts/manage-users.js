const sql = require('mssql');
const bcrypt = require('bcryptjs');
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

// Se cambia estos valores según se necesite

const accion = 'crear'; // 'crear' | 'listar' | 'eliminar' | 'cambiar-rol' | 'desactivar'

// Datos para CREAR usuario
const nuevoUsuario = {
  nombre_completo: 'Empleado 01',
  email: 'empleado@dyr.com',
  passwordPlain: 'empleado123!',
  rol: 'empleado' // 'administrador' | 'empleado'
};

// Datos para otras acciones
const emailObjetivo = '';
const nuevoRol = '';

async function main() {
  let pool;
  try {
    console.log('Conectando a Azure SQL...');
    pool = await sql.connect(config);
    console.log('Conexión establecida\n');

    switch (accion) {
      case 'crear':
        await crearUsuario(pool, nuevoUsuario);
        break;
      case 'listar':
        await listarUsuarios(pool);
        break;
      case 'eliminar':
        await eliminarUsuario(pool, emailObjetivo);
        break;
      case 'cambiar-rol':
        await cambiarRol(pool, emailObjetivo, nuevoRol);
        break;
      case 'desactivar':
        await desactivarUsuario(pool, emailObjetivo);
        break;
      default:
        console.log('Acción no válida. Opciones: crear, listar, eliminar, cambiar-rol, desactivar');
    }

  } catch (err) {
    console.error('Error general:', err.message);
    console.error('Detalles:', err);
  } finally {
    if (pool) await pool.close();
    console.log('\nConexión cerrada.');
  }
}

async function crearUsuario(pool, { nombre_completo, email, passwordPlain, rol }) {
  console.log(`Creando usuario: ${email}`);

  // Validar rol
  if (!['administrador', 'empleado'].includes(rol)) {
    console.log('Rol inválido. Debe ser "administrador" o "empleado".');
    return;
  }

  // Verificar si ya existe
  const existing = await pool.request()
    .input('email', sql.NVarChar(100), email)
    .query('SELECT usuario_id FROM inventario.usuarios WHERE email = @email');

  if (existing.recordset.length > 0) {
    console.log(`El usuario ${email} ya existe.`);
    return;
  }

  // Hash de contraseña
  const password_hash = await bcrypt.hash(passwordPlain, 10);

  // Insertar usuario
  await pool.request()
    .input('nombre_completo', sql.NVarChar(100), nombre_completo)
    .input('email', sql.NVarChar(100), email)
    .input('password_hash', sql.NVarChar(255), password_hash)
    .input('rol', sql.NVarChar(20), rol)
    .query(`
      INSERT INTO inventario.usuarios 
      (nombre_completo, email, password_hash, rol, activo, fecha_creacion)
      VALUES (@nombre_completo, @email, @password_hash, @rol, 1, GETDATE())
    `);

  console.log('Usuario creado exitosamente');
  console.log(`Email: ${email}`);
  console.log(`Rol: ${rol}`);
  console.log(`Contraseña: ${passwordPlain}\n`);

  // Registrar en audit_logs
  await registrarAuditoria(pool, null, 'CREATE_USER', 'usuarios', null, 
    `Usuario creado: ${email} con rol ${rol}`);
}

async function listarUsuarios(pool) {
  console.log('Listado de usuarios:\n');

  const result = await pool.request().query(`
    SELECT 
      usuario_id as ID,
      nombre_completo as Nombre,
      email as Email,
      rol as Rol,
      CASE WHEN activo = 1 THEN 'Activo' ELSE 'Inactivo' END as Estado,
      FORMAT(fecha_creacion, 'dd/MM/yyyy HH:mm') as Creado,
      FORMAT(ultimo_acceso, 'dd/MM/yyyy HH:mm') as [Ultimo Acceso]
    FROM inventario.usuarios
    ORDER BY fecha_creacion DESC
  `);

  if (result.recordset.length === 0) {
    console.log('No hay usuarios registrados.');
  } else {
    console.table(result.recordset);
    console.log(`\nTotal: ${result.recordset.length} usuario(s)\n`);
    
    // Mostrar permisos por rol
    console.log('PERMISOS POR ROL:');
    console.log('administrador: Acceso total (CRUD productos, ventas, usuarios, configuración)');
    console.log('empleado: Solo lectura productos, registrar ventas, NO puede eliminar ni gestionar usuarios\n');
  }
}

async function eliminarUsuario(pool, email) {
  console.log(`Eliminando usuario: ${email}`);

  // Verificar si existe
  const existing = await pool.request()
    .input('email', sql.NVarChar(100), email)
    .query('SELECT usuario_id, nombre_completo FROM inventario.usuarios WHERE email = @email');

  if (existing.recordset.length === 0) {
    console.log(`No se encontró usuario con email: ${email}`);
    return;
  }

  const usuario = existing.recordset[0];

  // Eliminar usuario
  const result = await pool.request()
    .input('email', sql.NVarChar(100), email)
    .query('DELETE FROM inventario.usuarios WHERE email = @email');

  if (result.rowsAffected[0] > 0) {
    console.log(`Usuario eliminado: ${usuario.nombre_completo} (${email})`);
    
    // Registrar en audit_logs
    await registrarAuditoria(pool, null, 'DELETE_USER', 'usuarios', usuario.usuario_id,
      `Usuario eliminado: ${email}`);
  }
}

async function cambiarRol(pool, email, nuevoRol) {
  console.log(`Cambiando rol de: ${email} a ${nuevoRol}`);

  // Validar rol
  if (!['administrador', 'empleado'].includes(nuevoRol)) {
    console.log('Rol inválido. Debe ser "administrador" o "empleado".');
    return;
  }

  // Verificar si existe
  const existing = await pool.request()
    .input('email', sql.NVarChar(100), email)
    .query('SELECT usuario_id, rol FROM inventario.usuarios WHERE email = @email');

  if (existing.recordset.length === 0) {
    console.log(`No se encontró usuario con email: ${email}`);
    return;
  }

  const rolAnterior = existing.recordset[0].rol;

  // Actualizar rol
  await pool.request()
    .input('email', sql.NVarChar(100), email)
    .input('nuevoRol', sql.NVarChar(20), nuevoRol)
    .query(`
      UPDATE inventario.usuarios 
      SET rol = @nuevoRol 
      WHERE email = @email
    `);

  console.log(`Rol actualizado de "${rolAnterior}" a "${nuevoRol}"`);

  // Registrar en audit_logs
  await registrarAuditoria(pool, existing.recordset[0].usuario_id, 'CHANGE_ROLE', 'usuarios', 
    existing.recordset[0].usuario_id, `Rol cambiado de ${rolAnterior} a ${nuevoRol}`);
}


async function desactivarUsuario(pool, email) {
  console.log(`Desactivando usuario: ${email}`);

  const result = await pool.request()
    .input('email', sql.NVarChar(100), email)
    .query(`
      UPDATE inventario.usuarios 
      SET activo = 0 
      WHERE email = @email
    `);

  if (result.rowsAffected[0] > 0) {
    console.log(`Usuario desactivado: ${email}`);
    console.log('El usuario no puede iniciar sesión pero los registros se mantienen');
  } else {
    console.log(`No se encontró usuario con email: ${email}`);
  }
}


async function registrarAuditoria(pool, usuario_id, accion, entidad, entidad_id, descripcion) {
  try {
    await pool.request()
      .input('usuario_id', sql.Int, usuario_id)
      .input('accion', sql.NVarChar(100), accion)
      .input('entidad', sql.NVarChar(50), entidad)
      .input('entidad_id', sql.Int, entidad_id)
      .input('descripcion', sql.NVarChar(400), descripcion)
      .query(`
        INSERT INTO inventario.audit_logs 
        (usuario_id, accion, entidad, entidad_id, fecha, descripcion)
        VALUES (@usuario_id, @accion, @entidad, @entidad_id, GETDATE(), @descripcion)
      `);
  } catch (err) {
    console.error('Error al registrar auditoría:', err.message);
  }
}

main();