// SERVIDOR PRINCIPAL
// Punto de entrada del backend

const express = require("express")
const cors = require("cors")
require("dotenv").config()

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Rutas
const authRoutes = require("./routes/auth-routes")
const inventoryRoutes = require("./routes/inventory-routes")
const salesRoutes = require("./routes/sales-routes")
//const providersRoutes = require("./routes/providers-routes")

app.use("/api/auth", authRoutes)
app.use("/api/inventory", inventoryRoutes)
app.use("/api/sales", salesRoutes)
//app.use("/api/providers", providersRoutes)

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "Backend D&R funcionando ✓" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Conectado en puerto ${PORT}`)
})
