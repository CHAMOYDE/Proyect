// CONTROLADOR DE VENTAS
// Maneja registro, lectura y reportes de ventas

const { sql, connectDB, getPool } = require("../config/db");

// Obtener todas las ventas (solo admin)
const getSales = async (req, res) => {
  try {
    if (req.user.rol !== "administrador") {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }

    await connectDB();
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT 
        v.venta_id AS id,
        v.producto_id AS productId,
        p.nombre AS productName,
        v.cantidad AS quantity,
        v.precio_unitario AS unitPrice,
        v.descuento AS discount,
        ROUND(v.total, 2) AS totalPrice,
        v.metodo_pago AS paymentMethod,
        v.fecha_venta AS date,
        v.es_temporada_alta AS isSeason
      FROM inventario.ventas v
      INNER JOIN inventario.productos p ON v.producto_id = p.producto_id
      WHERE v.activo = 1
      ORDER BY v.fecha_venta DESC
    `);

    res.json({ success: true, sales: result.recordset });
  } catch (error) {
    console.error("[SALES] Error obtener ventas:", error);
    res.status(500).json({ success: false, message: "Error al obtener ventas" });
  }
};

// Obtener venta por ID (solo admin)
const getSaleById = async (req, res) => {
  try {
    if (req.user.rol !== "administrador") {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }

    await connectDB();
    const pool = getPool();
    const { id } = req.params;

    const result = await pool.request()
      .input("id", sql.Int, Number.parseInt(id))
      .query(`
        SELECT 
          v.venta_id AS id,
          v.producto_id AS productId,
          p.nombre AS productName,
          v.cantidad AS quantity,
          v.precio_unitario AS unitPrice,
          v.descuento AS discount,
          ROUND(v.total, 2) AS totalPrice,
          v.metodo_pago AS paymentMethod,
          v.fecha_venta AS date,
          v.es_temporada_alta AS isSeason
        FROM inventario.ventas v
        INNER JOIN inventario.productos p ON v.producto_id = p.producto_id
        WHERE v.venta_id = @id AND v.activo = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Venta no encontrada" });
    }

    res.json({ success: true, sale: result.recordset[0] });
  } catch (error) {
    console.error("[SALES] Error obtener venta por ID:", error);
    res.status(500).json({ success: false, message: "Error al obtener venta" });
  }
};

// Crear venta (admin y empleado)
const createSale = async (req, res) => {
  try {
    if (!["administrador", "empleado"].includes(req.user.rol)) {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }

    await connectDB();
    const pool = getPool();
    const { 
      productId, 
      quantity, 
      discount = 0, 
      paymentMethod = "efectivo",
      isSeason = false 
    } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
    }

    // Verificar producto
    const productResult = await pool
      .request()
      .input("id", sql.Int, productId)
      .query("SELECT * FROM inventario.productos WHERE producto_id = @id AND activo = 1");

    if (productResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    const product = productResult.recordset[0];

    if (product.stock_actual < quantity) {
      return res.status(400).json({
        success: false,
        message: "Stock insuficiente",
        disponible: product.stock_actual,
      });
    }

    // Calcular precios
    const unitPrice = parseFloat(product.precio_venta);
    const subtotal = unitPrice * quantity;
    const discountAmount = (subtotal * parseFloat(discount)) / 100;
    const total = parseFloat((subtotal - discountAmount).toFixed(2));

    // Registrar venta
    await pool
      .request()
      .input("producto_id", sql.Int, productId)
      .input("usuario_id", sql.Int, req.user.id)
      .input("cantidad", sql.Int, quantity)
      .input("precio_unitario", sql.Decimal(10, 2), unitPrice)
      .input("descuento", sql.Decimal(5, 2), parseFloat(discount))
      .input("total", sql.Decimal(10, 2), total)
      .input("metodo_pago", sql.NVarChar(30), paymentMethod)
      .input("fecha_venta", sql.DateTime, new Date())
      .input("es_temporada_alta", sql.Bit, isSeason ? 1 : 0)
      .query(`
        INSERT INTO inventario.ventas 
        (producto_id, usuario_id, cantidad, precio_unitario, descuento, total, metodo_pago, fecha_venta, es_temporada_alta, activo)
        VALUES (@producto_id, @usuario_id, @cantidad, @precio_unitario, @descuento, @total, @metodo_pago, @fecha_venta, @es_temporada_alta, 1)
      `);

    // Actualizar stock
    await pool
      .request()
      .input("id", sql.Int, productId)
      .input("nuevoStock", sql.Int, product.stock_actual - quantity)
      .query("UPDATE inventario.productos SET stock_actual = @nuevoStock WHERE producto_id = @id");

    res.status(201).json({ success: true, message: "Venta registrada exitosamente" });
  } catch (error) {
    console.error("[SALES] Error crear venta:", error);
    res.status(500).json({ success: false, message: "Error al registrar la venta" });
  }
};

module.exports = { getSales, getSaleById, createSale };