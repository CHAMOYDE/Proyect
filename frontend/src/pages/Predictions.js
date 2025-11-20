"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { predictionsService } from "../services/api"
import { useNavigate } from "react-router-dom"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { FiMenu, FiChevronLeft, FiDownload, FiAlertTriangle, FiTrendingUp, FiBarChart2 } from "react-icons/fi"
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
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
    const [chartType, setChartType] = useState("bar")
    const [selectedPeriod, setSelectedPeriod] = useState(30)
    const [selectedProductInfo, setSelectedProductInfo] = useState(null)

    // Alias para el icono de "line chart" (FiLineChart no existe en react-icons/fi)
    const FiLineChartIcon = FiTrendingUp

    const getOverviewMetrics = () => {
        if (!allPredictions.length) return null

        // 1. Future Sales (Total predicted demand for next 30 days)
        const totalPredictedSales = allPredictions.reduce((sum, p) => sum + (p.predictedDemand || 0), 0)

        // 2. Stockout Risk (Products with < 15 days stock)
        const stockoutRiskProducts = allPredictions
            .filter((p) => p.daysUntilStockout < 15)
            .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
            .slice(0, 3)

        // 3. High Turnover (Top 3 by daily sales)
        const highTurnoverProducts = [...allPredictions]
            .sort((a, b) => (b.avgDailySales || 0) - (a.avgDailySales || 0))
            .slice(0, 3)

        // 4. Recommended Purchases (Top 3 by priority/urgency)
        const recommendedPurchases = allPredictions
            .filter((p) => p.recommendedOrder > 0)
            .sort((a, b) => {
                const priorityOrder = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 }
                return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
            })
            .slice(0, 3)

        return {
            totalPredictedSales,
            stockoutRiskProducts,
            highTurnoverProducts,
            recommendedPurchases,
        }
    }

    const overviewMetrics = getOverviewMetrics()

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
                setError(null)
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
            setSelectedProductInfo(null)
            return
        }

        setSelectedProduct(productId)
        setLoading(true)
        setError(null)

        try {
            const res = await predictionsService.getPredictions(productId, selectedPeriod)
            const pred = res.data.prediction[0]

            if (!pred) {
                setPredictionData([])
                setSelectedProductInfo(null)
                return
            }

            const avgDailySales = pred.avgDailySales || 0
            const variance = avgDailySales * 0.2 // 20% variance for realistic prediction

            const chartData = Array.from({ length: selectedPeriod }, (_, idx) => {
                // Generate data with slight realistic variation
                const baseForecast = avgDailySales
                const upper = baseForecast + variance
                const lower = Math.max(0, baseForecast - variance)
                const actual = baseForecast + (Math.random() - 0.5) * variance * 0.8

                return {
                    day: idx + 1,
                    fecha: `Día ${idx + 1}`,
                    demand: Math.round(actual),
                    forecast: Math.round(baseForecast),
                    upper: Math.round(upper),
                    lower: Math.round(lower),
                }
            })

            setPredictionData(chartData)
            setSelectedProductInfo({
                productName: pred.productName,
                currentStock: pred.currentStock,
                avgDailySales: pred.avgDailySales,
                predictedDemand: pred.predictedDemand,
                daysUntilStockout: pred.daysUntilStockout,
                recommendedOrder: pred.recommendedOrder,
                priority: pred.priority,
            })
        } catch (err) {
            console.error("Error obteniendo predicción:", err)
            setError("No se pudo obtener la predicción")
        } finally {
            setLoading(false)
        }
    }

    const handlePeriodChange = (newPeriod) => {
        setSelectedPeriod(newPeriod)
        if (selectedProduct) {
            handleSelectProduct(selectedProduct)
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

    const renderChart = () => {
        const commonProps = {
            width: "100%",
            height: 450,
            data: predictionData,
            margin: { top: 10, right: 30, left: 0, bottom: 10 },
        }

        const chartConfig = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} />
                <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    interval={Math.max(0, Math.floor(selectedPeriod / 8))}
                    angle={selectedPeriod > 14 ? -45 : 0}
                    height={selectedPeriod > 14 ? 80 : 40}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    label={{ value: "Unidades", angle: -90, position: "insideLeft", style: { fill: "#64748b" } }}
                />
                <Tooltip
                    contentStyle={{
                        background: "#ffffff",
                        border: "2px solid #6366f1",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: "#1e293b" }}
                    cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
            </>
        )

        switch (chartType) {
            case "line":
                return (
                    <ResponsiveContainer width={commonProps.width} height={commonProps.height}>
                        <LineChart data={predictionData} margin={commonProps.margin}>
                            {chartConfig}
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{ fill: "#6366f1", r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Demanda Predicha"
                                isAnimationActive={true}
                            />
                            <Line
                                type="monotone"
                                dataKey="demand"
                                stroke="#0ea5e9"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Demanda Real (Estimada)"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )
            case "area":
                return (
                    <ResponsiveContainer width={commonProps.width} height={commonProps.height}>
                        <AreaChart data={predictionData} margin={commonProps.margin}>
                            {chartConfig}
                            <Area
                                type="monotone"
                                dataKey="upper"
                                stroke="none"
                                fill="rgba(99, 102, 241, 0.1)"
                                name="Límite Superior (Optimista)"
                            />
                            <Area
                                type="monotone"
                                dataKey="forecast"
                                stroke="#6366f1"
                                fill="rgba(99, 102, 241, 0.3)"
                                strokeWidth={2}
                                name="Pronóstico Base"
                                isAnimationActive={true}
                            />
                            <Area
                                type="monotone"
                                dataKey="lower"
                                stroke="none"
                                fill="rgba(99, 102, 241, 0.05)"
                                name="Límite Inferior (Pesimista)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )
            default:
                return (
                    <ResponsiveContainer width={commonProps.width} height={commonProps.height}>
                        <BarChart data={predictionData} margin={commonProps.margin}>
                            {chartConfig}
                            <Bar
                                dataKey="forecast"
                                fill="#6366f1"
                                radius={[8, 8, 0, 0]}
                                name="Demanda Predicha"
                                isAnimationActive={true}
                            />
                            <Bar dataKey="demand" fill="#0ea5e9" radius={[8, 8, 0, 0]} opacity={0.6} name="Demanda Real (Estimada)" />
                        </BarChart>
                    </ResponsiveContainer>
                )
        }
    }

    const generateShoppingListPDF = () => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        doc.setFillColor(0, 150, 220)
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

        doc.setTextColor(51, 65, 85)
        doc.setFontSize(10)
        doc.text(`Generado: ${new Date().toLocaleString("es-PE")}`, 15, 60)
        doc.text(`Usuario: ${user?.nombre || "N/A"}`, 15, 67)

        const criticalProducts = allPredictions.filter((p) => p.priority === "CRITICA" || p.priority === "ALTA")

        doc.setFillColor(254, 226, 226)
        doc.roundedRect(15, 75, pageWidth - 30, 25, 3, 3, "F")

        doc.setFontSize(11)
        doc.setFont(undefined, "bold")
        doc.text("⚠️ Productos Críticos", 20, 85)

        doc.setFont(undefined, "normal")
        doc.setFontSize(10)
        doc.text(`Total de productos a reabastecer: ${criticalProducts.length}`, 20, 93)

        const tableData = criticalProducts.map((p) => [
            p.productName,
            (p.currentStock ?? "").toString(),
            (p.daysUntilStockout ?? "").toString(),
            (p.recommendedOrder ?? "").toString(),
            p.priority ?? "",
        ])

        // Usar autoTable importado correctamente
        autoTable(doc, {
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

        const finalY = doc.lastAutoTable?.finalY || 110
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

        doc.setFillColor(248, 250, 252)
        doc.rect(0, pageHeight - 25, pageWidth, 25, "F")

        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text("Sistema Predictivo de Inventario | D & R E.I.R.L.", pageWidth / 2, pageHeight - 15, { align: "center" })

        doc.save(`Lista_Compras_${new Date().toISOString().split("T")[0]}.pdf`)
    }

    const renderOverview = () => {
        if (!overviewMetrics) return null

        return (
            <div className="overview-dashboard">
                <h2 className="overview-title">Resumen de Predicciones</h2>
                <div className="overview-grid">
                    {/* Card 1: Future Sales */}
                    <div className="overview-card sales-card">
                        <div className="card-header">
                            <h3>Ventas Futuras (30 días)</h3>
                            <FiTrendingUp size={20} />
                        </div>
                        <div className="card-content">
                            <span className="big-number">{overviewMetrics.totalPredictedSales.toLocaleString()}</span>
                            <p className="card-subtitle">Unidades totales estimadas</p>
                        </div>
                    </div>

                    {/* Card 2: Stockout Risk */}
                    <div className="overview-card risk-card">
                        <div className="card-header">
                            <h3>Riesgo de Quiebre</h3>
                            <FiAlertTriangle size={20} />
                        </div>
                        <div className="card-content">
                            <ul className="overview-list">
                                {overviewMetrics.stockoutRiskProducts.length > 0 ? (
                                    overviewMetrics.stockoutRiskProducts.map((p) => (
                                        <li key={p.productId} className="list-item critical">
                                            <span className="item-name">{p.productName}</span>
                                            <span className="item-value">{p.daysUntilStockout} días</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="list-item safe">Sin riesgos inminentes</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Card 3: High Turnover */}
                    <div className="overview-card turnover-card">
                        <div className="card-header">
                            <h3>Mayor Rotación</h3>
                            <FiBarChart2 size={20} />
                        </div>
                        <div className="card-content">
                            <ul className="overview-list">
                                {overviewMetrics.highTurnoverProducts.map((p) => (
                                    <li key={p.productId} className="list-item">
                                        <span className="item-name">{p.productName}</span>
                                        <span className="item-value">{p.avgDailySales?.toFixed(1)} u/día</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Card 4: Recommended Purchases */}
                    <div className="overview-card purchase-card">
                        <div className="card-header">
                            <h3>Comprar Pronto</h3>
                            <FiDownload size={20} />
                        </div>
                        <div className="card-content">
                            <ul className="overview-list">
                                {overviewMetrics.recommendedPurchases.length > 0 ? (
                                    overviewMetrics.recommendedPurchases.map((p) => (
                                        <li key={p.productId} className="list-item">
                                            <span className="item-name">{p.productName}</span>
                                            <span className="item-value">{p.recommendedOrder} un.</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="list-item safe">Stock suficiente</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <Header isCollapsed={isCollapsed} />
            <div className="dashboard-wrapper">
                <aside className={`sidebar ${isCollapsed ? "closed" : "open"}`}>
                    <div className="sidebar-header">
                        <div className="logo-container">
                            <img src="/as.png" alt="Logo" className="logo-Image" />
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

                    {/* Inserted the overview dashboard before the product selector */}
                    {!selectedProduct && !loading && renderOverview()}

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

                    {selectedProduct && selectedProductInfo && (
                        <>
                            <div className="prediction-metrics-grid">
                                <div className="metric-card metric-stock">
                                    <span className="metric-label">Stock Actual</span>
                                    <span className="metric-value">{selectedProductInfo.currentStock}</span>
                                </div>
                                <div className="metric-card metric-daily">
                                    <span className="metric-label">Venta Diaria Promedio</span>
                                    <span className="metric-value">{selectedProductInfo.avgDailySales?.toFixed(1)}</span>
                                </div>
                                <div className="metric-card metric-days">
                                    <span className="metric-label">Días hasta Agotamiento</span>
                                    <span
                                        className={`metric-value days-${selectedProductInfo.daysUntilStockout < 7 ? "critical" : selectedProductInfo.daysUntilStockout < 15 ? "warning" : "normal"}`}
                                    >
                                        {selectedProductInfo.daysUntilStockout} días
                                    </span>
                                </div>
                                <div className="metric-card metric-order">
                                    <span className="metric-label">Pedido Recomendado</span>
                                    <span className="metric-value">{selectedProductInfo.recommendedOrder}</span>
                                </div>
                            </div>

                            <div className="prediction-chart-card">
                                <div className="chart-header">
                                    <div className="header-left">
                                        <FiTrendingUp size={24} />
                                        <div>
                                            <h3>Proyección de Demanda</h3>
                                            <p className="chart-subtitle">
                                                Próximos {selectedPeriod} días para {selectedProductInfo.productName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="chart-controls">
                                        {/* Period selector */}
                                        <div className="control-buttons">
                                            {[7, 14, 30].map((days) => (
                                                <button
                                                    key={days}
                                                    className={`period-btn ${selectedPeriod === days ? "active" : ""}`}
                                                    onClick={() => handlePeriodChange(days)}
                                                >
                                                    {days}d
                                                </button>
                                            ))}
                                        </div>
                                        {/* Chart type selector */}
                                        <div className="control-buttons">
                                            <button
                                                className={`chart-type-btn ${chartType === "bar" ? "active" : ""}`}
                                                onClick={() => setChartType("bar")}
                                                title="Gráfico de Barras"
                                            >
                                                <FiBarChart2 size={18} />
                                            </button>
                                            <button
                                                className={`chart-type-btn ${chartType === "line" ? "active" : ""}`}
                                                onClick={() => setChartType("line")}
                                                title="Gráfico de Líneas"
                                            >
                                                <FiLineChartIcon size={18} />
                                            </button>
                                            <button
                                                className={`chart-type-btn ${chartType === "area" ? "active" : ""}`}
                                                onClick={() => setChartType("area")}
                                                title="Gráfico de Área"
                                            >
                                                <FiBarChart2 size={18} style={{ transform: "rotateZ(90deg)" }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {predictionData.length > 0 && renderChart()}
                            </div>
                        </>
                    )}

                    {selectedProduct && predictionData.length === 0 && !loading && (
                        <div className="no-data-card">
                            <FiAlertTriangle size={32} />
                            <p>No hay datos disponibles para este producto</p>
                            <span>Asegúrate de que existan ventas registradas</span>
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
                                                <td className="text-center">{(p.avgDailySales ?? 0).toFixed(2)}</td>
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
