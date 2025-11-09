"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { salesService, inventoryService } from "../services/api"
import { useNavigate } from "react-router-dom"
import { jsPDF } from "jspdf"
import { FiMenu, FiChevronLeft, FiDownload, FiChevronDown, FiChevronUp } from "react-icons/fi"
import Header from "../components/Header"
import "./Sales.css"

const Sales = () => {
    const { user } = useAuth()
    const { theme } = useTheme()
    const navigate = useNavigate()

    const [sales, setSales] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showHistory, setShowHistory] = useState(false) // ← NUEVO: desplegable
    const [formData, setFormData] = useState({ productId: "", quantity: "" })
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [salesRes, productsRes] = await Promise.all([salesService.getSales(), inventoryService.getProducts()])
            const sortedSales = (salesRes.data.sales || []).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)
            setSales(sortedSales)
            setProducts(productsRes.data.products || [])
            setLoading(false)
        } catch (error) {
            console.error("Error al cargar datos:", error)
            alert("Error al cargar datos.")
        } finally {
            setLoading(false)
        }
    }

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)
    const toggleHistory = () => setShowHistory(!showHistory)

    const openModal = () => {
        setFormData({ productId: "", quantity: "" })
        setShowModal(true)
    }

    const closeModal = () => setShowModal(false)

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await salesService.createSale({
                productId: Number.parseInt(formData.productId),
                quantity: Number.parseInt(formData.quantity),
            })
            loadData()
            closeModal()
            alert("Venta registrada exitosamente.")
        } catch (error) {
            alert(error.response?.data?.message || "Error al registrar la venta")
        }
    }

    const getProductName = (productId) => {
        const product = products.find((p) => p.id === productId)
        return product ? product.name : "Desconocido"
    }

    // ÚLTIMAS 5 VENTAS
    const last5Sales = sales.slice(0, 5)

    const handleDownloadPDF = () => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        let y = 20

        // Add logo image to top right corner
        const logoSize = 15
        doc.addImage("/as.png", "PNG", pageWidth - logoSize - 10, 10, logoSize, logoSize)

        doc.setFillColor(30, 58, 138)
        doc.rect(0, 0, pageWidth, 45, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont(undefined, "bold")
        doc.text("D & R E.I.R.L.", pageWidth / 2, 18, { align: "center" })
        doc.setFontSize(14)
        doc.text("Reporte de Ventas", pageWidth / 2, 28, { align: "center" })

        y = 55
        doc.setTextColor(30, 58, 138)
        doc.setFontSize(18)
        doc.text("ÚLTIMAS 5 VENTAS", 14, y)
        y += 15

        last5Sales.forEach((sale, i) => {
            doc.setFontSize(10)
            doc.setTextColor(50, 50, 50)
            doc.text(
                `${i + 1}. ${sale.date} - ${getProductName(sale.productId)} x${sale.quantity} = S/ ${sale.totalPrice}`,
                14,
                y,
            )
            y += 8
        })

        doc.save(`Ventas_Ultimas5_${new Date().toISOString().split("T")[0]}.pdf`)
    }

    return (
        <>
            <Header />
            <div className="dashboard-wrapper">
                {/* SIDEBAR */}
                <aside className={`sidebar ${isCollapsed ? "closed" : "open"} ${theme}`}>
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
                        <button className="nav-item active">Ventas</button>
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

                {/* CONTENIDO */}
                <div className={`content-area ${isCollapsed ? "collapsed" : ""}`}>
                    <header className="page-header">
                        <div className="title-section">
                            <h1>Gestión de Ventas</h1>
                            <p>Últimas ventas registradas</p>
                        </div>
                        <button onClick={openModal} className="btn-new-sale">
                            + Nueva Venta
                        </button>
                    </header>

                    {/* BOTONES ACCIÓN */}
                    <div className="action-buttons">
                        <button onClick={handleDownloadPDF} className="btn-pdf">
                            <FiDownload size={16} /> Descargar PDF
                        </button>
                        <button onClick={toggleHistory} className="btn-history">
                            {showHistory ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                            Ver Historial
                        </button>
                    </div>

                    {/* DESPLEGABLE DE ÚLTIMAS 5 VENTAS */}
                    <div className={`history-dropdown ${showHistory ? "open" : ""}`}>
                        <div className="history-header">
                            <h3>Últimas 5 Ventas</h3>
                        </div>
                        <div className="history-list">
                            {last5Sales.length === 0 ? (
                                <p className="no-sales">No hay ventas registradas</p>
                            ) : (
                                last5Sales.map((sale) => (
                                    <div key={sale.id} className="history-item">
                                        <div>
                                            <strong>{getProductName(sale.productId)}</strong>
                                            <span className="quantity">x{sale.quantity}</span>
                                        </div>
                                        <div>
                                            <span className="date">{sale.date}</span>
                                            <span className="total">S/ {sale.totalPrice}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* TABLA PRINCIPAL (opcional, puedes ocultar si solo quieres el desplegable) */}
                    {/* <div className="sales-table-container"> ... </div> */}
                </div>

                {/* MODAL NUEVA VENTA */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>Registrar Nueva Venta</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Producto</label>
                                    <select name="productId" value={formData.productId} onChange={handleInputChange} required>
                                        <option value="">Selecciona un producto</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - Stock: {p.stock} - S/ {p.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Cantidad</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        min="1"
                                        required
                                    />
                                </div>
                                {formData.productId && formData.quantity && (
                                    <div className="sale-summary">
                                        <p>
                                            <strong>Total:</strong> S/{" "}
                                            {(products.find((p) => p.id === Number.parseInt(formData.productId))?.price || 0) *
                                                formData.quantity}
                                        </p>
                                    </div>
                                )}
                                <div className="modal-actions">
                                    <button type="button" onClick={closeModal} className="btn-cancel">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        Registrar Venta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default Sales
