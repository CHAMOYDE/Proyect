require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a la base de datos al iniciar
connectDB()
  .then(() => console.log("Conexión a la base de datos establecida"))
  .catch((err) => {
    console.error("Error al conectar a la base de datos:", err);
    process.exit(1);
  });

// Rutas
app.use("/api/auth", require("./routes/auth-routes"));
app.use("/api/inventory", require("./routes/inventory-routes"));
app.use("/api/sales", require("./routes/sales-routes"));
app.use("/api/predictions", require("./routes/predictions-routes"));
app.use("/api/providers", require("./routes/providers-routes"));

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API funcionando correctamente" });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});