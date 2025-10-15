const pool = require('./db');
const { users, products, sales } = require('./mockData');

(async () => {
  try {
    console.log('Insertando datos en la base de datos...');

    // Limpiar las tablas (por si ya tienen datos)
    await pool.query('DELETE FROM ventas');
    await pool.query('DELETE FROM productos');
    await pool.query('DELETE FROM usuarios');

    // Insertar usuarios
    for (const user of users) {
      await pool.query(
        `INSERT INTO usuarios (nombre, correo, password, rol)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (correo) DO NOTHING`,
        [user.name, `${user.username}@empresa.local`, user.password, user.role]
      );
    }
    console.log('Usuarios insertados.');

    // Insertar productos
    for (const product of products) {
      await pool.query(
        `INSERT INTO productos (nombre, descripcion, categoria, precio, stock)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (nombre) DO NOTHING`,
        [product.name, product.sku, product.category, product.price, product.stock]
      );
    }
    console.log('Productos insertados.');

    // Insertar ventas (enlazadas a productos)
    for (const sale of sales) {
      await pool.query(
        `INSERT INTO ventas (producto_id, cantidad, total)
         VALUES ($1, $2, $3)`,
        [sale.productId, sale.quantity, sale.totalPrice]
      );
    }
    console.log(' Ventas insertadas.');

    console.log('Carga completada exitosamente.');
  } catch (error) {
    console.error('Error al insertar datos:', error.message);
  } finally {
    pool.end();
  }
})();
