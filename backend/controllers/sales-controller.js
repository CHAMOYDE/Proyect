// CONTROLADOR DE VENTAS
// Maneja registro, lectura y reportes de ventas

const sql = require("mssql")
const pool = require("../config/db")

// CAMBIAR: Tablas: ventas, productos. Columnas: venta_id, producto_id, cantidad, total, fecha_venta

const getSales = async (req, res) => {
  try {
    const result = await pool.request().query(`
            SELECT 
                v.venta_id AS id,
                v.producto_id AS productId,
                p.nombre AS productName,
                v.cantidad AS quantity,
                v.total AS totalPrice,
                v.fecha_venta AS date
            FROM inventario.ventas v
            INNER JOIN inventario.productos p ON v.producto_id = p.id
            ORDER BY v.fecha_venta DESC
        `)

    res.json({ success: true, data: result.recordset })
  } catch (error) {
    console.error("[SALES] Error obtener ventas:", error)
    res.status(500).json({ success: false, message: "Error al obtener ventas" })
  }
}

const createSale = async (req, res) => {
  try {
    const { productId, quantity } = req.body

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: "Faltan datos" })
    }

    // CAMBIAR: Obtén el producto con tus columnas reales
    const productResult = await pool
      .request()
      .input("id", sql.Int, productId)
      .query("SELECT * FROM inventario.productos WHERE producto_id = @id")

    if (productResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" })
    }

    const product = productResult.recordset[0]

    // Verificar stock
    if (product.stock_actual < quantity) {
      return res.status(400).json({
        success: false,
        message: "Stock insuficiente",
        disponible: product.stock_actual,
      })
    }

    const total = product.precio_venta * quantity

    // Registrar venta
    await pool
      .request()
      .input("producto_id", sql.Int, productId)
      .input("cantidad", sql.Int, quantity)
      .input("total", sql.Decimal(10, 2), total)
      .input("fecha_venta", sql.DateTime, new Date())
      .query(`
                INSERT INTO inventario.ventas 
                (producto_id, cantidad, total, fecha_venta)
                VALUES (@producto_id, @cantidad, @total, @fecha_venta)
            `)

    // Actualizar stock
    await pool
      .request()
      .input("id", sql.Int, productId)
      .input("nuevoStock", sql.Int, product.stock_actual - quantity)
      .query("UPDATE inventario.productos SET stock_actual = @nuevoStock WHERE producto_id = @id")

    res.status(201).json({ success: true, message: "Venta registrada" })
  } catch (error) {
    console.error("[SALES] Error crear venta:", error)
    res.status(500).json({ success: false, message: "Error al registrar venta" })
  }
}

module.exports = { getSales, createSale }
