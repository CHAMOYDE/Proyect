const express = require("express");
const router = express.Router();
const { authMiddleware, checkRole } = require("../middleware/auth");
const salesController = require("../controllers/sales-controller");

// Rutas de ventas

// Solo admin puede ver todas las ventas
router.get("/", authMiddleware, checkRole("administrador"), salesController.getSales);

// Solo admin puede ver venta por ID
router.get("/:id", authMiddleware, checkRole("administrador"), salesController.getSaleById);

// Admin y empleado pueden crear ventas
router.post("/", authMiddleware, salesController.createSale);

module.exports = router;
