// MIDDLEWARE DE AUTENTICACIÓN
// Valida JWT y verifica roles

const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar autenticación mediante JWT
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    // Guardamos la info del usuario decodificada en la request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[AUTH] Error middleware:", error);
    res.status(500).json({ success: false, message: "Error en autenticación" });
  }
};

/**
 * Middleware para verificar roles
 * @param  {...string} rolesPermitidos - Roles permitidos para la ruta
 */
const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: "Permisos insuficientes",
      });
    }

    next();
  };
};

/**
 * Middleware para loguear requests autenticados
 */
const logAuthenticatedRequest = (req, res, next) => {
  if (req.user) {
    console.log(`[LOG] Usuario ${req.user.usuario_id} accedió a ${req.method} ${req.originalUrl}`);
  }
  next();
};

module.exports = { authMiddleware, checkRole, logAuthenticatedRequest };
