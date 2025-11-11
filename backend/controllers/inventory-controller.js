const { sql, connectDB, getPool } = require("../config/db");

// Obtener todos los productos
const getProducts = async (req, res) => {
  try {
    await connectDB();
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        producto_id AS id,
        codigo_sku AS sku,
        nombre,
        categoria,
        precio_venta AS price,
        stock_actual AS stock,
        stock_minimo AS minStock,
        proveedor AS supplier
      FROM inventario.productos
      WHERE activo = 1
      ORDER BY nombre ASC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("[INVENTORY] Error obtener productos:", error);
    res.status(500).json({ success: false, message: "Error al obtener productos" });
  }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    await connectDB();
    const pool = getPool();

    const result = await pool.request()
      .input("id", sql.Int, Number.parseInt(id))
      .query(`
        SELECT 
          producto_id AS id,
          codigo_sku AS sku,
          nombre,
          categoria,
          precio_venta AS price,
          stock_actual AS stock,
          stock_minimo AS minStock,
          proveedor AS supplier
        FROM inventario.productos
        WHERE producto_id = @id AND activo = 1
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ success: false, message: "Producto no encontrado" });

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error("[INVENTORY] Error obtener producto:", error);
    res.status(500).json({ success: false, message: "Error al obtener producto" });
  }
};

// Crear, actualizar, eliminar y alertas deben usar también:
// await connectDB(); const pool = getPool();

module.exports = {
  getProducts,
  getProductById,
  createProduct: async (req, res) => {
    try {
      await connectDB();
      const pool = getPool();
      const { nombre, codigo_sku, categoria, precio_venta, stock_actual, stock_minimo, proveedor } = req.body;

      if (!nombre || !codigo_sku || !precio_venta)
        return res.status(400).json({ success: false, message: "Campos requeridos faltantes" });

      await pool.request()
        .input("codigo_sku", sql.NVarChar(50), codigo_sku)
        .input("nombre", sql.NVarChar(200), nombre)
        .input("categoria", sql.NVarChar(50), categoria || "general")
        .input("precio_venta", sql.Decimal(10, 2), precio_venta)
        .input("stock_actual", sql.Int, stock_actual || 0)
        .input("stock_minimo", sql.Int, stock_minimo || 1)
        .input("proveedor", sql.NVarChar(100), proveedor || "")
        .query(`
          INSERT INTO inventario.productos 
          (codigo_sku, nombre, categoria, precio_venta, stock_actual, stock_minimo, proveedor, activo)
          VALUES (@codigo_sku, @nombre, @categoria, @precio_venta, @stock_actual, @stock_minimo, @proveedor, 1)
        `);

      res.status(201).json({ success: true, message: "Producto creado" });
    } catch (error) {
      console.error("[INVENTORY] Error crear producto:", error);
      res.status(500).json({ success: false, message: "Error al crear producto" });
    }
  },

  updateProduct: async (req, res) => {
    try {
      await connectDB();
      const pool = getPool();
      const { id } = req.params;
      const { nombre, codigo_sku, categoria, precio_venta, stock_actual, stock_minimo, proveedor } = req.body;

      await pool.request()
        .input("id", sql.Int, Number.parseInt(id))
        .input("nombre", sql.NVarChar(200), nombre)
        .input("codigo_sku", sql.NVarChar(50), codigo_sku)
        .input("categoria", sql.NVarChar(50), categoria)
        .input("precio_venta", sql.Decimal(10, 2), precio_venta)
        .input("stock_actual", sql.Int, stock_actual)
        .input("stock_minimo", sql.Int, stock_minimo)
        .input("proveedor", sql.NVarChar(100), proveedor)
        .query(`
          UPDATE inventario.productos
          SET 
            nombre = @nombre,
            codigo_sku = @codigo_sku,
            categoria = @categoria,
            precio_venta = @precio_venta,
            stock_actual = @stock_actual,
            stock_minimo = @stock_minimo,
            proveedor = @proveedor
          WHERE producto_id = @id
        `);

      res.json({ success: true, message: "Producto actualizado" });
    } catch (error) {
      console.error("[INVENTORY] Error actualizar:", error);
      res.status(500).json({ success: false, message: "Error al actualizar" });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      await connectDB();
      const pool = getPool();
      const { id } = req.params;

      await pool.request()
        .input("id", sql.Int, Number.parseInt(id))
        .query("UPDATE inventario.productos SET activo = 0 WHERE producto_id = @id");

      res.json({ success: true, message: "Producto eliminado" });
    } catch (error) {
      console.error("[INVENTORY] Error eliminar:", error);
      res.status(500).json({ success: false, message: "Error al eliminar" });
    }
  },

  getAlerts: async (req, res) => {
    try {
      await connectDB();
      const pool = getPool();

      const result = await pool.request().query(`
        SELECT 
          producto_id AS id,
          codigo_sku AS sku,
          nombre,
          stock_actual AS stock,
          stock_minimo AS minStock
        FROM inventario.productos
        WHERE stock_actual <= stock_minimo AND activo = 1
        ORDER BY stock_actual ASC
      `);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      console.error("[INVENTORY] Error alertas:", error);
      res.status(500).json({ success: false, message: "Error al obtener alertas" });
    }
  }
};
