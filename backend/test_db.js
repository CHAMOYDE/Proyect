const pool = require('./data/db');

(async () => {
  try {
    const result = await pool.query('SELECT * FROM usuarios;');
    console.log('Usuarios registrados:', result.rows);
  } catch (err) {
    console.error('Error en la consulta:', err.message);
  } finally {
    pool.end();
  }
})();
