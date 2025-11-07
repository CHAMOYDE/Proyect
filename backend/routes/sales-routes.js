// RUTAS DE VENTAS

const express = require("express")
const router = express.Router()
const { authMiddleware, checkRole } = require("../middleware/auth")
const { getSales, createSale } = require("../controllers/sales-controller")

router.use(authMiddleware)

// Lectura - Todos autenticados
router.get("/", getSales)

// Crear venta - Empleado o admin
router.post("/", checkRole("administrador", "empleado"), createSale)

module.exports = router
