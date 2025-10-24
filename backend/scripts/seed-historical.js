const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const productos = [
    { nombre: 'Cable HDMI 1.5m', categoria: 'Cables', precio: 15.00, stock: 100 },
    { nombre: 'Tinta HP 664', categoria: 'Tintas', precio: 45.00, stock: 50 },
    { nombre: 'Audífono Gamer Halion X15', categoria: 'Audífonos', precio: 120.00, stock: 30 },
    { nombre: 'Mouse Inalámbrico Logitech M170', categoria: 'Mouses', precio: 65.00, stock: 40 },
    { nombre: 'Teclado Logitech MK120', categoria: 'Teclados', precio: 85.00, stock: 35 },
    { nombre: 'Parlante Micronics S502', categoria: 'Parlantes', precio: 95.00, stock: 25 },
    { nombre: 'Ventilador ICEBERG 6', categoria: 'Accesorios', precio: 140.00, stock: 20 },
    { nombre: 'Audífono Cat EAR AKZ 023', categoria: 'Audífonos', precio: 90.00, stock: 15 },
    { nombre: 'Mouse Gamer Cybertel M300', categoria: 'Mouses', precio: 70.00, stock: 25 },
    { nombre: 'Parlante Enkore Fortis', categoria: 'Parlantes', precio: 110.00, stock: 20 },
    { nombre: 'Teclado Enkore Office Wired', categoria: 'Teclados', precio: 75.00, stock: 30 }
];

function generarVentasConTendencia(fecha) {
    const mes = fecha.getMonth() + 1;
    let base = 5 + Math.random() * 10;
    if (mes === 3 || mes === 4) base *= 3; // temporada alta
    if (mes === 7 || mes === 8) base *= 0.6; // baja
    return Math.round(base);
}

(async () => {
    let pool;
    try {
        console.log('Conectando a Azure SQL...');
        pool = await sql.connect(config);
        console.log('Conectado correctamente a Azure SQL.');

        // Limpiar tablas
        await pool.request().query(`
            DELETE FROM historial_demanda;
            DELETE FROM ventas;
            DELETE FROM productos;
        `);
        console.log('Tablas limpiadas correctamente.');

        // Insertar productos con SKU único
        for (let i = 0; i < productos.length; i++) {
            const p = productos[i];
            const sku = `SKU-${(i + 1).toString().padStart(3, '0')}`;
            await pool.request()
                .input('sku', sql.VarChar, sku)
                .input('nombre', sql.VarChar, p.nombre)
                .input('categoria', sql.VarChar, p.categoria)
                .input('precio', sql.Decimal(10, 2), p.precio)
                .input('stock', sql.Int, p.stock)
                .query(`
                    INSERT INTO productos (sku, nombre, categoria, precio, stock, creado_en)
                    VALUES (@sku, @nombre, @categoria, @precio, @stock, GETDATE())
                `);
        }
        console.log(`${productos.length} productos insertados.`);

        // Obtener IDs de productos
        const result = await pool.request().query('SELECT id, precio FROM productos');
        const productosBD = result.recordset;

        const hoy = new Date();
        const inicio = new Date();
        inicio.setMonth(hoy.getMonth() - 6);

        let registros = 0;
        for (let d = new Date(inicio); d <= hoy; d.setDate(d.getDate() + 1)) {
            for (const p of productosBD) {
                const cantidad = generarVentasConTendencia(d);
                if (cantidad > 0) {
                    const total = p.precio * cantidad;

                    // Insertar en historial_demanda
                    await pool.request()
                        .input('producto_id', sql.Int, p.id)
                        .input('fecha', sql.Date, d)
                        .input('cantidad_vendida', sql.Int, cantidad)
                        .query(`
                            INSERT INTO historial_demanda (producto_id, fecha, cantidad_vendida, registrado_en)
                            VALUES (@producto_id, @fecha, @cantidad_vendida, GETDATE())
                        `);

                    // Insertar en ventas
                    await pool.request()
                        .input('producto_id', sql.Int, p.id)
                        .input('cantidad', sql.Int, cantidad)
                        .input('total', sql.Decimal(10, 2), total)
                        .input('fecha_venta', sql.Date, d)
                        .query(`
                            INSERT INTO ventas (producto_id, cantidad, total, fecha_venta)
                            VALUES (@producto_id, @cantidad, @total, @fecha_venta)
                        `);

                    registros++;
                }
            }
        }

        console.log(`${registros} registros históricos insertados correctamente.`);
    } catch (err) {
        console.error('Error en seed:', err.message);
    } finally {
        if (pool) await pool.close();
        console.log('Conexión cerrada.');
    }
})();
