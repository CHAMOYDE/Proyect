// RUTAS DE AUTENTICACIÓN
// Solo login, el resto se maneja en otros controladores

const express = require("express")
const router = express.Router()
const { login } = require("../controllers/auth-controller")

// POST /api/auth/login - Iniciar sesión
router.post("/login", login)

module.exports = router
