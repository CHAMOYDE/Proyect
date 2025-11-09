"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { inventoryService, salesService } from "../services/api"
import { useNavigate } from "react-router-dom"
import { FiMenu, FiChevronLeft } from "react-icons/fi"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Header from "../components/Header"
import "./Dashboard.css"

const Dashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { theme } = useTheme()
    const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0, expiring: 0, totalSales: 0 })
    const [chartData, setChartData] = useState([])
    const [categoryData, setCategoryData] = useState([])
    const [loading, setLoading] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [productsRes, salesRes] = await Promise.all([inventoryService.getProducts(), salesService.getSales()])

            const products = productsRes.data.products || []
            const sales = salesRes.data.sales || []

            const lowStockCount = products.filter((p) => p.stock <= p.minStock).length
            const totalSalesAmount = sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0)

            setStats({
                totalProducts: products.length,
                lowStock: lowStockCount,
                expiring: Math.floor(products.length * 0.1),
                totalSales: totalSalesAmount,
            })

            setChartData([
                { mes: "Mes 1", ventas: 4000 },
                { mes: "Mes 2", ventas: 3000 },
                { mes: "Mes 3", ventas: 2000 },
                { mes: "Mes 4", ventas: 2800 },
                { mes: "Mes 5", ventas: 1890 },
                { mes: "Mes 6", ventas: 2390 },
            ])

            const categoryCount = {}
            products.forEach((p) => {
                const cat = p.category || "Otros"
                categoryCount[cat] = (categoryCount[cat] || 0) + 1
            })
            setCategoryData(
                Object.entries(categoryCount).map(([name, value]) => ({
                    name,
                    value,
                })),
            )

            setLoading(false)
        } catch (error) {
            console.error("Error:", error)
            setLoading(false)
        }
    }

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)
    const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#f43f5e"]

    return (
        <>
            <Header />
            <div className="dashboard-wrapper">
                <aside className={`sidebar ${isCollapsed ? "closed" : "open"}`}>
                    <div className="sidebar-header">
                        <div className="logo-container">
                            <img src="/as.png" alt="Logo" className="logo-image" />
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
                        <button onClick={() => navigate("/purchases")} className="nav-item">
                            Lista de Compras
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
                            <p className="stat-change positive">+12% vs mes anterior</p>
                        </div>
                        <div className="stat-card card-yellow">
                            <div className="card-header">
                                <h3>Bajo Stock</h3>
                                <span className="card-icon">⚠️</span>
                            </div>
                            <p className="stat-number">{stats.lowStock}</p>
                            <p className="stat-change negative">-5% vs mes anterior</p>
                        </div>
                        <div className="stat-card card-red">
                            <div className="card-header">
                                <h3>Próximos a Vencer</h3>
                                <span className="card-icon">⏰</span>
                            </div>
                            <p className="stat-number">{stats.expiring}</p>
                            <p className="stat-change negative">+3% vs mes anterior</p>
                        </div>
                        <div className="stat-card card-blue">
                            <div className="card-header">
                                <h3>Ventas Totales</h3>
                                <span className="card-icon">💰</span>
                            </div>
                            <p className="stat-number">${stats.totalSales}</p>
                            <p className="stat-change positive">+18% vs mes anterior</p>
                        </div>
                    </div>

                    <div className="charts-section">
                        <div className="chart-container">
                            <h3>Ventas Últimos 6 Meses</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="ventas" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-container">
                            <h3>Distribución por Categoría</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) =>
                                            `${name}: ${Math.round((value / categoryData.reduce((a, b) => a + b.value, 0)) * 100)}%`
                                        }
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
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Dashboard
