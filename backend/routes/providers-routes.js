const express = require("express");
const router = express.Router();
const { authMiddleware, checkRole } = require("../middleware/auth");
const { 
    getProviders, 
    getProductsByProvider,
    createProvider,
    updateProvider,
    deleteProvider
} = require("../controllers/providers-controller");

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/providers - Obtener todos los proveedores
router.get("/", getProviders);

// GET /api/providers/:providerName/products - Obtener productos de un proveedor
router.get("/:providerName/products", getProductsByProvider);

// POST /api/providers - Crear proveedor (solo admin)
router.post("/", checkRole("administrador"), createProvider);

// PUT /api/providers/:providerName - Actualizar proveedor (solo admin)
router.put("/:providerName", checkRole("administrador"), updateProvider);

// DELETE /api/providers/:providerName - Eliminar proveedor (solo admin)
router.delete("/:providerName", checkRole("administrador"), deleteProvider);

module.exports = router;