const express = require("express");
const router = express.Router();
const { authMiddleware, checkRole } = require("../middleware/auth");
const { login, getCurrentUser } = require("../controllers/auth-controller");

router.post("/login", login);
router.get("/current", authMiddleware, getCurrentUser);
router.get("/admin-data", authMiddleware, checkRole("administrador"), (req, res) => {
  res.json({ message: "Solo admin puede ver esto" });
});

module.exports = router;
