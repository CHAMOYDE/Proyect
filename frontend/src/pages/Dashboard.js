"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { inventoryService, salesService } from "../services/api"
import { useNavigate } from "react-router-dom"
import { FiMenu, FiChevronLeft } from "react-icons/fi"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Header from "../components/Header"
import "./Dashboard.css"

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{payload[0].payload.mes}</p>
        <p className="value">S/ {payload[0].value.toLocaleString("es-PE", { maximumFractionDigits: 2 })}</p>
      </div>
    )
  }
  return null
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    expiring: 0,
    totalSales: 0,
  })
  const [chartData, setChartData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar productos
      const productsRes = await inventoryService.getProducts()
      console.log("Products Response:", productsRes.data)

      // Los productos vienen en: productsRes.data.data
      const products = (productsRes.data.data || []).map((p) => ({
        id: p.id,
        name: p.nombre,
        stock: p.stock,
        minStock: p.minStock,
        price: p.price,
        sku: p.sku,
        category: p.categoria || "Otros",
      }))

      // Cargar ventas (solo si es admin)
      let sales = []
      if (user?.rol === "administrador") {
        try {
          const salesRes = await salesService.getSales()
          console.log("Sales Response:", salesRes.data)

          // Las ventas vienen en: salesRes.data.sales
          sales = (salesRes.data.sales || []).map((s) => ({
            id: s.id,
            productId: s.productId,
            productName: s.productName,
            quantity: s.quantity,
            total: s.totalPrice,
            date: s.date,
          }))
        } catch (err) {
          console.log("No se pudieron cargar las ventas (puede ser por permisos)")
        }
      }

      // Calcular estadísticas
      const lowStockCount = products.filter((p) => p.stock <= p.minStock).length
      const totalSalesAmount = sales.reduce((sum, s) => sum + (s.total || 0), 0)

      setStats({
        totalProducts: products.length,
        lowStock: lowStockCount,
        expiring: Math.floor(products.length * 0.1),
        totalSales: totalSalesAmount,
      })

      // Gráfico de ventas últimos 6 meses
      const monthlySales = {}
      sales.forEach((sale) => {
        const date = new Date(sale.date)
        const month = date.toLocaleString("es-ES", { month: "short" })
        const year = date.getFullYear()
        const key = `${month} ${year}`
        monthlySales[key] = (monthlySales[key] || 0) + (sale.total || 0)
      })

      setChartData(
        Object.entries(monthlySales)
          .map(([mes, ventas]) => ({ mes, ventas }))
          .slice(-6), // Últimos 6 meses
      )

      // Gráfico de categorías
      const categoryCount = {}
      products.forEach((p) => {
        const cat = p.category || "Otros"
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      })

      setCategoryData(Object.entries(categoryCount).map(([name, value]) => ({ name, value })))

      setLoading(false)
    } catch (error) {
      console.error("Error cargando dashboard:", error)
      alert("Error al cargar los datos del dashboard")
      setLoading(false)
    }
  }

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)
  const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#f43f5e"]

  return (
    <>
      <Header isCollapsed={isCollapsed} />
      <div className="dashboard-wrapper">
        <aside className={`sidebar ${isCollapsed ? "closed" : "open"}`}>
          <div className="sidebar-header">
            <div className="logo-container">
              <img src="/as.png" alt="Logo" className="Logo-image" />
            </div>
            <button className="toggle-btn" onClick={toggleSidebar}>
              {isCollapsed ? <FiChevronLeft size={22} /> : <FiMenu size={22} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            <button className="nav-item active">Inicio</button>
            <button onClick={() => navigate("/inventory")} className="nav-item">
              Inventario
            </button>
            <button onClick={() => navigate("/sales")} className="nav-item">
              Ventas
            </button>
            <button onClick={() => navigate("/predictions")} className="nav-item">
              Predicciones
            </button>
            <button onClick={() => navigate("/providers")} className="nav-item">
              Proveedores
            </button>
          </nav>
        </aside>

        <div className={`content-area ${isCollapsed ? "collapsed" : ""}`}>
          <header className="page-header">
            <div className="title-section">
              <h1>Bienvenido al Dashboard</h1>
              <p>Visión general del estado actual de tu inventario y ventas</p>
            </div>
          </header>

          <div className="stats-grid">
            <div className="stat-card card-green">
              <div className="card-header">
                <h3>Total de Productos</h3>
                <span className="card-icon">📦</span>
              </div>
              <p className="stat-number">{stats.totalProducts}</p>
            </div>
            <div className="stat-card card-yellow">
              <div className="card-header">
                <h3>Bajo Stock</h3>
                <span className="card-icon">⚠️</span>
              </div>
              <p className="stat-number">{stats.lowStock}</p>
            </div>
            <div className="stat-card card-red">
              <div className="card-header">
                <h3>Próximos a Vencer</h3>
                <span className="card-icon">⏰</span>
              </div>
              <p className="stat-number">{stats.expiring}</p>
            </div>
            <div className="stat-card card-blue">
              <div className="card-header">
                <h3>Ventas Totales</h3>
                <span className="card-icon">💰</span>
              </div>
              <p className="stat-number">S/ {Math.round(stats.totalSales)}</p>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h3>Ventas Últimos Meses</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 200, 255, 0.1)" vertical={false} />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: "#b0b0b0", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(0, 200, 255, 0.2)" }}
                    />
                    <YAxis
                      tick={{ fill: "#b0b0b0", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(0, 200, 255, 0.2)" }}
                      tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="ventas" fill="#0096dc" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No hay datos de ventas disponibles</p>
              )}
            </div>

            <div className="chart-container">
              <h3>Distribución por Categoría</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => {
                        const total = categoryData.reduce((a, b) => a + b.value, 0)
                        const percent = Math.round((value / total) * 100)
                        return `${name}: ${percent}%`
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No hay datos de categorías disponibles</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
