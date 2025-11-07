// MIDDLEWARE DE AUTENTICACIÓN
// Valida JWT y verifica roles

const jwt = require("jsonwebtoken")

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado",
      })
    }

    const token = authHeader.replace("Bearer ", "")

    // CAMBIAR: JWT_SECRET en tu .env
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token inválido o expirado",
      })
    }

    req.user = decoded
    next()
  } catch (error) {
    console.error("[AUTH] Error middleware:", error)
    res.status(500).json({ success: false, message: "Error autenticación" })
  }
}

// Middleware para verificar roles
const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "No autenticado" })
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: "Permisos insuficientes",
      })
    }

    next()
  }
}

module.exports = { authMiddleware, checkRole }
