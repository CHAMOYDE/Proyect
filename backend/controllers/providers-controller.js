const { sql, connectDB, getPool } = require('../config/db');

// Obtener todos los proveedores con conteo de productos
const getProviders = async (req, res) => {
    try {
        await connectDB();
        const pool = getPool();
        
        const result = await pool.request().query(`
            SELECT 
                p.proveedor_id AS id,
                p.nombre,
                p.contacto,
                p.telefono,
                p.correo AS email,
                COUNT(prod.producto_id) AS total_productos
            FROM inventario.proveedores p
            LEFT JOIN inventario.productos prod ON p.nombre = prod.proveedor AND prod.activo = 1
            GROUP BY p.proveedor_id, p.nombre, p.contacto, p.telefono, p.correo
            ORDER BY p.nombre ASC
        `);
        
        res.json({ success: true, providers: result.recordset });
    } catch (err) {
        console.error("Error obteniendo proveedores:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error cargando proveedores", 
            error: err.message 
        });
    }
};

// Obtener productos de un proveedor específico
const getProductsByProvider = async (req, res) => {
    try {
        await connectDB();
        const pool = getPool();
        const { providerName } = req.params;
        
        const result = await pool.request()
            .input('proveedor', sql.NVarChar(100), providerName)
            .query(`
                SELECT 
                    producto_id AS id,
                    codigo_sku AS sku,
                    nombre,
                    categoria,
                    precio_venta AS price,
                    stock_actual AS stock,
                    stock_minimo AS minStock
                FROM inventario.productos
                WHERE proveedor = @proveedor AND activo = 1
                ORDER BY nombre ASC
            `);
        
        res.json({ success: true, products: result.recordset });
    } catch (err) {
        console.error("Error obteniendo productos del proveedor:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error cargando productos del proveedor", 
            error: err.message 
        });
    }
};

// Crear proveedor
const createProvider = async (req, res) => {
    try {
        await connectDB();
        const pool = getPool();
        const { nombre, contacto, telefono, email } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ 
                success: false, 
                message: "El nombre del proveedor es requerido" 
            });
        }
        
        await pool.request()
            .input('nombre', sql.NVarChar(100), nombre)
            .input('contacto', sql.NVarChar(100), contacto || '')
            .input('telefono', sql.NVarChar(20), telefono || '')
            .input('correo', sql.NVarChar(100), email || '')
            .query(`
                INSERT INTO inventario.proveedores (nombre, contacto, telefono, correo)
                VALUES (@nombre, @contacto, @telefono, @correo)
            `);
        
        res.status(201).json({ success: true, message: "Proveedor creado exitosamente" });
    } catch (err) {
        console.error("Error creando proveedor:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error creando proveedor", 
            error: err.message 
        });
    }
};

// Actualizar proveedor
const updateProvider = async (req, res) => {
    try {
        await connectDB();
        const pool = getPool();
        const { providerName } = req.params;
        const { nombre, contacto, telefono, email } = req.body;
        
        await pool.request()
            .input('nombreOriginal', sql.NVarChar(100), providerName)
            .input('nombre', sql.NVarChar(100), nombre)
            .input('contacto', sql.NVarChar(100), contacto || '')
            .input('telefono', sql.NVarChar(20), telefono || '')
            .input('correo', sql.NVarChar(100), email || '')
            .query(`
                UPDATE inventario.proveedores
                SET nombre = @nombre,
                    contacto = @contacto,
                    telefono = @telefono,
                    correo = @correo
                WHERE nombre = @nombreOriginal
            `);
        
        res.json({ success: true, message: "Proveedor actualizado exitosamente" });
    } catch (err) {
        console.error("Error actualizando proveedor:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error actualizando proveedor", 
            error: err.message 
        });
    }
};

// Eliminar proveedor
const deleteProvider = async (req, res) => {
    try {
        await connectDB();
        const pool = getPool();
        const { providerName } = req.params;
        
        // Verificar si tiene productos asociados
        const checkResult = await pool.request()
            .input('proveedor', sql.NVarChar(100), providerName)
            .query(`
                SELECT COUNT(*) AS total
                FROM inventario.productos
                WHERE proveedor = @proveedor AND activo = 1
            `);
        
        if (checkResult.recordset[0].total > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No se puede eliminar el proveedor porque tiene productos asociados" 
            });
        }
        
        await pool.request()
            .input('nombre', sql.NVarChar(100), providerName)
            .query(`DELETE FROM inventario.proveedores WHERE nombre = @nombre`);
        
        res.json({ success: true, message: "Proveedor eliminado exitosamente" });
    } catch (err) {
        console.error("Error eliminando proveedor:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error eliminando proveedor", 
            error: err.message 
        });
    }
};

module.exports = { 
    getProviders, 
    getProductsByProvider,
    createProvider,
    updateProvider,
    deleteProvider
};