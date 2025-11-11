const { sql, connectDB, getPool } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = "8h";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Faltan credenciales" });
    }

    await connectDB();
    const pool = getPool();

    const result = await pool.request()
      .input("email", sql.NVarChar(100), email)
      .query(`
        SELECT usuario_id AS id, nombre_completo AS nombre, email, password_hash AS hash, rol
        FROM inventario.usuarios
        WHERE email = @email AND activo = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    });

  } catch (error) {
    console.error("[AUTH] Error login:", error);
    res.status(500).json({ success: false, message: "Error en el login" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: "No autorizado" });
    res.json({ success: true, user });
  } catch (error) {
    console.error("[AUTH] Error getCurrentUser:", error);
    res.status(500).json({ success: false, message: "Error al obtener usuario" });
  }
};

module.exports = { login, getCurrentUser };
