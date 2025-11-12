"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { predictionsService } from "../services/api"
import { useNavigate } from "react-router-dom"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { FiMenu, FiChevronLeft, FiDownload, FiAlertTriangle, FiTrendingUp } from "react-icons/fi"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import Header from "../components/Header"
import "./Predictions.css"

const Predictions = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [predictionData, setPredictionData] = useState([])
    const [allPredictions, setAllPredictions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        loadProducts()
        loadAllPredictions()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const res = await predictionsService.getProducts()
            console.log("Productos cargados:", res.data)
            setProducts(res.data.products || [])
        } catch (err) {
            console.error("Error cargando productos:", err)
            setError("No se pudieron cargar los productos: " + (err.response?.data?.message || err.message))
        } finally {
            setLoading(false)
        }
    }

    const loadAllPredictions = async () => {
        try {
            const res = await predictionsService.getAllPredictions()
            console.log("Predicciones cargadas:", res.data)
            setAllPredictions(res.data.predictions || [])
            if (res.data.predictions?.length > 0) {
                setError(null) // Limpiar error si se cargó correctamente
            }
        } catch (err) {
            console.error("Error cargando predicciones:", err)
            console.error("Detalles del error:", err.response?.data)
            setError("No se pudieron cargar las predicciones: " + (err.response?.data?.message || err.message))
        }
    }

    const handleSelectProduct = async (productId) => {
        if (!productId) {
            setPredictionData([])
            setSelectedProduct(null)
            return
        }

        setSelectedProduct(productId)
        setLoading(true)
        setError(null)

        try {
            const res = await predictionsService.getPredictions(productId, 30)
            const pred = res.data.prediction[0]

            if (!pred) {
                setPredictionData([])
                return
            }

            // Generar datos para el gráfico
            const chartData = Array.from({ length: 30 }, (_, idx) => ({
                day: `Día ${idx + 1}`,
                demanda: Math.round(pred.avgDailySales * (1 + (Math.random() - 0.5) * 0.3)),
            }))

            setPredictionData(chartData)
        } catch (err) {
            console.error("Error obteniendo predicción:", err)
            setError("No se pudo obtener la predicción")
        } finally {
            setLoading(false)
        }
    }

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "CRITICA":
                return "critical"
            case "ALTA":
                return "high"
            case "MEDIA":
                return "medium"
            case "BAJA":
                return "low"
            default:
                return "low"
        }
    }

    const generateShoppingListPDF = () => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        // Header
        doc.setFillColor(99, 102, 241)
        doc.rect(0, 0, pageWidth, 50, "F")

        try {
            doc.addImage("/as.png", "PNG", pageWidth - 30, 10, 20, 20)
        } catch (e) {
            console.log("Logo no encontrado")
        }

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont(undefined, "bold")
        doc.text("D & R E.I.R.L.", 15, 25)

        doc.setFontSize(14)
        doc.setFont(undefined, "normal")
        doc.text("Lista de Compras Recomendada", 15, 35)

        // Información
        doc.setTextColor(51, 65, 85)
        doc.setFontSize(10)
        doc.text(`Generado: ${new Date().toLocaleString("es-PE")}`, 15, 60)
        doc.text(`Usuario: ${user?.nombre || "N/A"}`, 15, 67)

        // Filtrar productos que necesitan reabastecimiento
        const criticalProducts = allPredictions.filter((p) => p.priority === "CRITICA" || p.priority === "ALTA")

        // Resumen
        doc.setFillColor(254, 226, 226)
        doc.roundedRect(15, 75, pageWidth - 30, 25, 3, 3, "F")

        doc.setFontSize(11)
        doc.setFont(undefined, "bold")
        doc.text("⚠️ Productos Críticos", 20, 85)

        doc.setFont(undefined, "normal")
        doc.setFontSize(10)
        doc.text(`Total de productos a reabastecer: ${criticalProducts.length}`, 20, 93)

        // Tabla de productos
        const tableData = criticalProducts.map((p) => [
            p.productName,
            p.currentStock.toString(),
            p.daysUntilStockout.toString(),
            p.recommendedOrder.toString(),
            p.priority,
        ])

        doc.autoTable({
            startY: 110,
            head: [["Producto", "Stock Actual", "Días Restantes", "Cant. Recomendada", "Prioridad"]],
            body: tableData,
            theme: "grid",
            headStyles: {
                fillColor: [220, 38, 38],
                textColor: 255,
                fontSize: 10,
                fontStyle: "bold",
                halign: "center",
            },
            bodyStyles: {
                fontSize: 9,
                textColor: 51,
            },
            alternateRowStyles: {
                fillColor: [254, 242, 242],
            },
            columnStyles: {
                0: { halign: "left", cellWidth: 70 },
                1: { halign: "center", cellWidth: 25 },
                2: { halign: "center", cellWidth: 30 },
                3: { halign: "center", cellWidth: 35 },
                4: { halign: "center", cellWidth: 25 },
            },
            margin: { left: 15, right: 15 },
        })

        // Recomendaciones
        const finalY = doc.lastAutoTable.finalY || 110
        if (pageHeight - finalY > 60) {
            doc.setFillColor(239, 246, 255)
            doc.roundedRect(15, finalY + 10, pageWidth - 30, 40, 3, 3, "F")

            doc.setFontSize(11)
            doc.setFont(undefined, "bold")
            doc.setTextColor(30, 64, 175)
            doc.text("💡 Recomendaciones:", 20, finalY + 20)

            doc.setFont(undefined, "normal")
            doc.setFontSize(9)
            doc.setTextColor(51, 65, 85)
            doc.text("• Priorizar productos con estado CRÍTICO (días restantes < 7)", 25, finalY + 28)
            doc.text("• Considerar tiempos de entrega del proveedor", 25, finalY + 34)
            doc.text("• Verificar presupuesto disponible antes de realizar pedidos", 25, finalY + 40)
            doc.text("• Contactar proveedores para confirmar disponibilidad", 25, finalY + 46)
        }

        // Footer
        doc.setFillColor(248, 250, 252)
        doc.rect(0, pageHeight - 25, pageWidth, 25, "F")

        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text("Sistema Predictivo de Inventario | D & R E.I.R.L.", pageWidth / 2, pageHeight - 15, { align: "center" })

        doc.save(`Lista_Compras_${new Date().toISOString().split("T")[0]}.pdf`)
    }

    return (
        <>
            <Header isCollapsed={isCollapsed} />
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
                        <button className="nav-item active">Predicciones</button>
                        <button onClick={() => navigate("/providers")} className="nav-item">
                            Proveedores
                        </button>
                    </nav>
                </aside>

                <div className={`content-area ${isCollapsed ? "collapsed" : ""}`}>
                    <header className="page-header">
                        <div className="title-section">
                            <h1>Predicciones de Demanda</h1>
                            <p>Análisis predictivo basado en IA para optimizar tu inventario</p>
                        </div>
                        <button onClick={generateShoppingListPDF} className="btn-new-product">
                            <FiDownload size={18} /> Generar Lista de Compras
                        </button>
                    </header>

                    {error && (
                        <div className="error-banner">
                            <FiAlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="predictions-controls">
                        <div className="control-group">
                            <label>Analizar Producto Individual:</label>
                            <select
                                value={selectedProduct || ""}
                                onChange={(e) => handleSelectProduct(Number(e.target.value))}
                                className="product-selector"
                            >
                                <option value=""> Seleccionar producto </option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedProduct && predictionData.length > 0 && (
                        <div className="prediction-chart-card">
                            <div className="card-header">
                                <FiTrendingUp size={24} />
                                <h3>Proyección de Demanda - Próximos 30 Días</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={predictionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} interval={2} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "white",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="demanda" fill="#6366f1" radius={[8, 8, 0, 0]} name="Demanda Estimada" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="predictions-table-container">
                        <div className="table-header">
                            <h3>Todas las Predicciones</h3>
                            <p className="subtitle">Análisis completo de {allPredictions.length} productos</p>
                        </div>

                        {allPredictions.length > 0 ? (
                            <div className="table-wrapper">
                                <table className="predictions-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Stock Actual</th>
                                            <th>Venta Diaria Promedio</th>
                                            <th>Demanda Predicha (30d)</th>
                                            <th>Días hasta Agotamiento</th>
                                            <th>Pedido Recomendado</th>
                                            <th>Prioridad</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allPredictions.map((p) => (
                                            <tr key={p.productId || p.id} className={`priority-${getPriorityColor(p.priority)}`}>
                                                <td className="product-name">{p.productName}</td>
                                                <td className="text-center">
                                                    <span className="stock-badge">{p.currentStock}</span>
                                                </td>
                                                <td className="text-center">{p.avgDailySales.toFixed(2)}</td>
                                                <td className="text-center">
                                                    <strong>{p.predictedDemand}</strong>
                                                </td>
                                                <td className="text-center">
                                                    <span
                                                        className={`days-badge ${p.daysUntilStockout < 7 ? "critical" : p.daysUntilStockout < 15 ? "warning" : "normal"}`}
                                                    >
                                                        {p.daysUntilStockout} días
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="order-badge">{p.recommendedOrder}</span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`priority-badge ${getPriorityColor(p.priority)}`}>{p.priority}</span>
                                                </td>
                                                <td className="alert-cell">{p.alert}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-data-card">
                                <p>No hay predicciones disponibles</p>
                                <span>Asegúrate de que existan ventas registradas para generar predicciones</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Predictions
