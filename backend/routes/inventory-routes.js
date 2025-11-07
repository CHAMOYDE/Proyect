// RUTAS DE INVENTARIO
// CRUD de productos con protección de roles

const express = require("express")
const router = express.Router()
const { authMiddleware, checkRole } = require("../middleware/auth")
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAlerts,
} = require("../controllers/inventory-controller")

// Todas requieren autenticación
router.use(authMiddleware)

// GET - Lectura (todos autenticados)
router.get("/", getProducts)
router.get("/alerts", getAlerts)
router.get("/:id", getProductById)

// POST, PUT, DELETE - Solo admin
router.post("/", checkRole("administrador"), createProduct)
router.put("/:id", checkRole("administrador"), updateProduct)
router.delete("/:id", checkRole("administrador"), deleteProduct)

module.exports = router
