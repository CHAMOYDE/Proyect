// backend/data/seedDatabase.js
const pool = require('./db');
const { users, products, sales } = require('./mockData');

(async () => {
  try {
    console.log('Insertando datos en la base de datos...');

    // Limpiar tablas
    await pool.query('DELETE FROM historial_demanda');
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
    console.log('✅ Usuarios insertados.');

    // Insertar productos
    for (const product of products) {
      await pool.query(
        `INSERT INTO productos (sku, nombre, descripcion, categoria, precio, stock, min_stock, fecha_vencimiento, proveedor)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (sku) DO NOTHING`,
        [
          product.sku,
          product.name,
          product.name, // usamos el nombre como descripción genérica
          product.category,
          product.price,
          product.stock,
          product.minStock,
          product.expiryDate,
          product.supplier
        ]
      );
    }
    console.log('Productos insertados.');

    // Insertar ventas
    for (const sale of sales) {
      await pool.query(
        `INSERT INTO ventas (producto_id, cantidad, total, fecha_venta)
         VALUES ($1, $2, $3, $4)`,
        [sale.productId, sale.quantity, sale.totalPrice, sale.date]
      );

      // 🔹 También llenar historial de demanda
      await pool.query(
        `INSERT INTO historial_demanda (producto_id, fecha, cantidad_vendida)
         VALUES ($1, $2, $3)`,
        [sale.productId, sale.date, sale.quantity]
      );
    }

    console.log('Ventas e historial de demanda insertados.');
    console.log('Carga completada exitosamente.');

  } catch (error) {
    console.error('Error al insertar datos:', error.message);
  } finally {
    pool.end();
  }
})();
