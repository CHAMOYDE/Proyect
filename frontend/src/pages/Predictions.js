"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { predictionsService, inventoryService } from "../services/api"
import { useNavigate } from "react-router-dom"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { FiMenu, FiChevronLeft } from "react-icons/fi"
import Header from "../components/Header"
import "./Predictions.css"

const Predictions = () => {
    const { user } = useAuth()
    const { theme } = useTheme()
    const navigate = useNavigate()
    const [predictions, setPredictions] = useState([])
    const [trends, setTrends] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedProduct, setSelectedProduct] = useState("")
    const [days, setDays] = useState(30)
    const [selectedPrediction, setSelectedPrediction] = useState(null)
    const [isCollapsed, setIsCollapsed] = useState(false)

    const COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b", "#fa709a"]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [predictionsRes, trendsRes, productsRes] = await Promise.all([
                predictionsService.getPredictions(),
                predictionsService.getTrends(),
                inventoryService.getProducts(),
            ])
            setPredictions(predictionsRes.data.predictions || [])
            setTrends(trendsRes.data.trends || [])
            setProducts(productsRes.data.products || [])
            setLoading(false)
        } catch (error) {
            console.error("Error al cargar datos:", error)
            setLoading(false)
        }
    }

    const handleProductSearch = async () => {
        if (!selectedProduct) return

        try {
            const response = await predictionsService.getPredictions(selectedProduct, days)
            setSelectedPrediction(response.data.prediction)
        } catch (error) {
            console.error("Error al obtener predicción:", error)
            alert("Error al obtener la predicción")
        }
    }

    const trendChartData = trends.slice(0, 5).map((trend) => ({
        name: trend.productName.substring(0, 15) + "...",
        ventas: trend.totalQuantity,
        ingresos: trend.totalRevenue,
    }))

    const priorityData = [
        { name: "Alta", value: predictions.filter((p) => p.priority === "Alta").length, color: "#ff4444" },
        { name: "Media", value: predictions.filter((p) => p.priority === "Media").length, color: "#ffaa00" },
        { name: "Baja", value: predictions.filter((p) => p.priority === "Baja").length, color: "#00cc66" },
    ].filter((item) => item.value > 0)

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)

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
                        <button onClick={() => navigate("/dashboard")} className="nav-item">
                            Inicio
                        </button>
                        <button onClick={() => navigate("/inventory")} className="nav-item">
                            Inventario
                        </button>
                        <button onClick={() => navigate("/sales")} className="nav-item">
                            Ventas
                        </button>
                        <button onClick={() => navigate("/predictions")} className="nav-item active">
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
                            <h1>Predicciones y Análisis con IA</h1>
                            <p>Análisis de demanda y tendencias de ventas</p>
                        </div>
                    </header>

                    <div className="prediction-content">
                        <div className="prediction-search">
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
                                Predicción por Producto
                            </h3>
                            <div className="search-form">
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">Selecciona un producto</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} - Stock: {product.stock}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                    placeholder="Días a predecir"
                                    min="1"
                                    max="365"
                                />
                                <button onClick={handleProductSearch} className="btn-primary">
                                    Predecir
                                </button>
                            </div>

                            {selectedPrediction && (
                                <div className="prediction-result">
                                    <div className="prediction-card">
                                        <h4 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
                                            {selectedPrediction.productName}
                                        </h4>
                                        <div className="prediction-stats">
                                            <div className="stat">
                                                <span className="stat-label">Stock Actual</span>
                                                <span className="stat-value">{selectedPrediction.currentStock}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Ventas Diarias Promedio</span>
                                                <span className="stat-value">{selectedPrediction.avgDailySales}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Demanda Predicha ({days} días)</span>
                                                <span className="stat-value" style={{ color: "#667eea" }}>
                                                    {selectedPrediction.predictedDemand}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Días hasta agotamiento</span>
                                                <span
                                                    className="stat-value"
                                                    style={{
                                                        color: selectedPrediction.daysUntilStockout < 7 ? "#ef4444" : "#22c55e",
                                                    }}
                                                >
                                                    {selectedPrediction.daysUntilStockout}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Recomendación de Pedido</span>
                                                <span className="stat-value" style={{ color: "#22c55e" }}>
                                                    {selectedPrediction.recommendedOrder} unidades
                                                </span>
                                            </div>
                                        </div>
                                        <span
                                            className={`alert-badge ${selectedPrediction.daysUntilStockout < 7
                                                ? "alert-danger"
                                                : selectedPrediction.daysUntilStockout < 15
                                                    ? "alert-warning"
                                                    : "alert-success"
                                                }`}
                                        >
                                            {selectedPrediction.alert || "Stock adecuado"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="charts-grid">
                            <div className="chart-card">
                                <h3 className="chart-title">Tendencias de Ventas (Top 5)</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={trendChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="ventas" fill="#667eea" name="Cantidad Vendida" />
                                        <Bar dataKey="ingresos" fill="#764ba2" name="Ingresos (S/)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="chart-card">
                                <h3 className="chart-title">Distribución de Prioridades</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={priorityData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {priorityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="predictions-table">
                            <h3 className="table-title">Predicciones de Demanda</h3>
                            <table className="table">
                                <thead className="thead">
                                    <tr>
                                        <th className="th">Producto</th>
                                        <th className="th">Stock Actual</th>
                                        <th className="th">Venta Diaria Prom.</th>
                                        <th className="th">Demanda Predicha (30d)</th>
                                        <th className="th">Días hasta agotamiento</th>
                                        <th className="th">Pedido Recomendado</th>
                                        <th className="th">Prioridad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.map((pred, index) => (
                                        <tr key={index}>
                                            <td className="td">{pred.productName}</td>
                                            <td className="td">{pred.currentStock}</td>
                                            <td className="td">{pred.avgDailySales}</td>
                                            <td className="td" style={{ fontWeight: "700" }}>
                                                {pred.predictedDemand}
                                            </td>
                                            <td
                                                className="td"
                                                style={{
                                                    color:
                                                        pred.daysUntilStockout < 7
                                                            ? "#ef4444"
                                                            : pred.daysUntilStockout < 15
                                                                ? "#f59e0b"
                                                                : "#22c55e",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {pred.daysUntilStockout}
                                            </td>
                                            <td className="td">{pred.recommendedOrder}</td>
                                            <td className="td">
                                                <span
                                                    className={`badge ${pred.priority === "Alta"
                                                        ? "badge-alta"
                                                        : pred.priority === "Media"
                                                            ? "badge-media"
                                                            : "badge-baja"
                                                        }`}
                                                >
                                                    {pred.priority}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Predictions
