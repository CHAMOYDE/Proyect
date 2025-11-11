const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory-controller");
const { authMiddleware, checkRole } = require("../middleware/auth");

// Rutas de inventario
router.get("/", authMiddleware, inventoryController.getProducts);
router.get("/:id", authMiddleware, inventoryController.getProductById);

// Solo admin puede modificar inventario
router.post("/", authMiddleware, checkRole("administrador"), inventoryController.createProduct);
router.put("/:id", authMiddleware, checkRole("administrador"), inventoryController.updateProduct);
router.delete("/:id", authMiddleware, checkRole("administrador"), inventoryController.deleteProduct);

// Alertas
router.get("/alerts/low-stock", authMiddleware, inventoryController.getAlerts);

module.exports = router;
