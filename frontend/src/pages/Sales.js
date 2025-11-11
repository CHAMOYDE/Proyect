"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { salesService, inventoryService } from "../services/api"
import { useNavigate } from "react-router-dom"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { FiMenu, FiChevronLeft, FiDownload, FiChevronDown, FiChevronUp } from "react-icons/fi"
import Header from "../components/Header"
import "./Sales.css"

const Sales = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [sales, setSales] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [showPdfOptions, setShowPdfOptions] = useState(false)
    const [pdfDateRange, setPdfDateRange] = useState({ start: "", end: "" })
    const [formData, setFormData] = useState({
        productId: "",
        quantity: "",
        discount: "0",
        paymentMethod: "efectivo",
        isSeason: false
    })
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [salesRes, productsRes] = await Promise.all([
                salesService.getSales(),
                inventoryService.getProducts()
            ])

            const sortedSales = (salesRes.data.sales || []).sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            )
            setSales(sortedSales)
            setProducts(productsRes.data.data || [])
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
        setFormData({
            productId: "",
            quantity: "",
            discount: "0",
            paymentMethod: "efectivo",
            isSeason: false
        })
        setShowModal(true)
    }

    const closeModal = () => setShowModal(false)

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await salesService.createSale({
                productId: parseInt(formData.productId),
                quantity: parseInt(formData.quantity),
                discount: parseFloat(formData.discount),
                paymentMethod: formData.paymentMethod,
                isSeason: formData.isSeason
            })
            loadData()
            closeModal()
            alert("Venta registrada exitosamente.")
        } catch (error) {
            alert(error.response?.data?.message || "Error al registrar la venta")
        }
    }

    const getProductById = (productId) => {
        return products.find((p) => p.id === productId)
    }

    const calculateTotal = () => {
        if (!formData.productId || !formData.quantity) return 0
        const product = getProductById(parseInt(formData.productId))
        if (!product) return 0
        const subtotal = product.price * formData.quantity
        const discount = (subtotal * parseFloat(formData.discount)) / 100
        return subtotal - discount
    }

    const last5Sales = sales.slice(0, 5)

    const generatePDF = (dateRange = null) => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        // Filtrar ventas por rango de fechas
        let filteredSales = sales
        if (dateRange && dateRange.start && dateRange.end) {
            filteredSales = sales.filter(sale => {
                const saleDate = new Date(sale.date)
                return saleDate >= new Date(dateRange.start) && saleDate <= new Date(dateRange.end)
            })
        }

        // Header con fondo degradado
        doc.setFillColor(99, 102, 241)
        doc.rect(0, 0, pageWidth, 50, "F")

        // Logo
        try {
            doc.addImage("/as.png", "PNG", pageWidth - 30, 10, 20, 20)
        } catch (e) {
            console.log("Logo no encontrado")
        }

        // Título
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont(undefined, "bold")
        doc.text("D & R E.I.R.L.", 15, 25)

        doc.setFontSize(14)
        doc.setFont(undefined, "normal")
        doc.text("Reporte de Ventas", 15, 35)

        // Información del reporte
        doc.setTextColor(51, 65, 85)
        doc.setFontSize(10)
        doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 15, 60)
        doc.text(`Usuario: ${user?.nombre || "N/A"}`, 15, 67)

        if (dateRange && dateRange.start && dateRange.end) {
            doc.text(
                `Período: ${new Date(dateRange.start).toLocaleDateString('es-PE')} - ${new Date(dateRange.end).toLocaleDateString('es-PE')}`,
                15,
                74
            )
        }

        // Resumen de ventas
        const totalVentas = filteredSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0)
        const totalProductos = filteredSales.reduce((sum, s) => sum + (s.quantity || 0), 0)

        doc.setFillColor(240, 249, 255)
        doc.roundedRect(15, 85, pageWidth - 30, 25, 3, 3, "F")

        doc.setFontSize(11)
        doc.setFont(undefined, "bold")
        doc.text("Resumen General", 20, 95)

        doc.setFont(undefined, "normal")
        doc.setFontSize(10)
        doc.text(`Total de Ventas: ${filteredSales.length}`, 20, 103)
        doc.text(`Productos Vendidos: ${totalProductos}`, pageWidth / 2, 103)
        doc.text(`Monto Total: S/ ${totalVentas.toFixed(2)}`, 20, 108)

        // Tabla de ventas
        const tableData = filteredSales.map(sale => {
            const product = getProductById(sale.productId)
            return [
                new Date(sale.date).toLocaleDateString('es-PE'),
                product?.nombre || sale.productName || "N/A",
                sale.quantity,
                `S/ ${(sale.totalPrice / sale.quantity).toFixed(2)}`,
                sale.discount ? `${sale.discount}%` : "0%",
                `S/ ${sale.totalPrice.toFixed(2)}`
            ]
        })

        doc.autoTable({
            startY: 120,
            head: [["Fecha", "Producto", "Cant.", "P. Unit.", "Desc.", "Total"]],
            body: tableData,
            theme: "grid",
            headStyles: {
                fillColor: [99, 102, 241],
                textColor: 255,
                fontSize: 10,
                fontStyle: "bold",
                halign: "center"
            },
            bodyStyles: {
                fontSize: 9,
                textColor: 51
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { halign: "center", cellWidth: 25 },
                1: { halign: "left", cellWidth: 60 },
                2: { halign: "center", cellWidth: 20 },
                3: { halign: "right", cellWidth: 25 },
                4: { halign: "center", cellWidth: 20 },
                5: { halign: "right", cellWidth: 25 }
            },
            margin: { left: 15, right: 15 }
        })

        // Footer
        const finalY = doc.lastAutoTable.finalY || 120
        if (pageHeight - finalY > 30) {
            doc.setFillColor(248, 250, 252)
            doc.rect(0, pageHeight - 25, pageWidth, 25, "F")

            doc.setFontSize(8)
            doc.setTextColor(100, 116, 139)
            doc.text(
                "Sistema de Gestión de Inventario | D & R E.I.R.L.",
                pageWidth / 2,
                pageHeight - 15,
                { align: "center" }
            )
            doc.text(
                `Página 1 | www.dyrcompany.com`,
                pageWidth / 2,
                pageHeight - 10,
                { align: "center" }
            )
        }

        // Guardar PDF
        const fileName = dateRange && dateRange.start && dateRange.end
            ? `Ventas_${dateRange.start}_${dateRange.end}.pdf`
            : `Ventas_${new Date().toISOString().split("T")[0]}.pdf`

        doc.save(fileName)
        setShowPdfOptions(false)
    }

    const handleDownloadPDF = () => {
        if (pdfDateRange.start && pdfDateRange.end) {
            generatePDF(pdfDateRange)
        } else {
            generatePDF()
        }
    }

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
                        <button className="nav-item active">Ventas</button>
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
                            <h1>Gestión de Ventas</h1>
                            <p>Últimas ventas registradas</p>
                        </div>
                        <button onClick={openModal} className="btn-new-sale">
                            + Nueva Venta
                        </button>
                    </header>

                    <div className="action-buttons">
                        <button onClick={() => setShowPdfOptions(!showPdfOptions)} className="btn-pdf">
                            <FiDownload size={16} /> Descargar PDF
                        </button>
                        <button onClick={toggleHistory} className="btn-history">
                            {showHistory ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                            Ver Historial
                        </button>
                    </div>

                    {showPdfOptions && (
                        <div className="pdf-options-panel">
                            <h4>Opciones de Reporte</h4>
                            <div className="date-range-inputs">
                                <div className="form-group">
                                    <label>Fecha Inicio</label>
                                    <input
                                        type="date"
                                        value={pdfDateRange.start}
                                        onChange={(e) => setPdfDateRange({ ...pdfDateRange, start: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha Fin</label>
                                    <input
                                        type="date"
                                        value={pdfDateRange.end}
                                        onChange={(e) => setPdfDateRange({ ...pdfDateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleDownloadPDF} className="btn-generate-pdf">
                                Generar Reporte
                            </button>
                        </div>
                    )}

                    <div className={`history-dropdown ${showHistory ? "open" : ""}`}>
                        <div className="history-header">
                            <h3>Últimas 5 Ventas</h3>
                        </div>
                        <div className="history-list">
                            {last5Sales.length === 0 ? (
                                <p className="no-sales">No hay ventas registradas</p>
                            ) : (
                                last5Sales.map((sale) => {
                                    const product = getProductById(sale.productId)
                                    return (
                                        <div key={sale.id} className="history-item">
                                            <div className="history-product">
                                                <strong>{product?.nombre || sale.productName || "N/A"}</strong>
                                                <span className="quantity">x{sale.quantity}</span>
                                            </div>
                                            <div className="history-details">
                                                <span className="date">
                                                    {new Date(sale.date).toLocaleDateString('es-PE')}
                                                </span>
                                                <span className="total">S/ {sale.totalPrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="sales-table-wrapper">
                        <h3>Historial Completo</h3>
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>P. Unitario</th>
                                    <th>Descuento</th>
                                    <th>Total</th>
                                    <th>Método Pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="no-data">
                                            No hay ventas registradas
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map((sale) => {
                                        const product = getProductById(sale.productId)
                                        return (
                                            <tr key={sale.id}>
                                                <td>{new Date(sale.date).toLocaleDateString('es-PE')}</td>
                                                <td>{product?.nombre || sale.productName || "N/A"}</td>
                                                <td className="text-center">{sale.quantity}</td>
                                                <td className="text-right">
                                                    S/ {(sale.totalPrice / sale.quantity).toFixed(2)}
                                                </td>
                                                <td className="text-center">
                                                    {sale.discount ? `${sale.discount}%` : "0%"}
                                                </td>
                                                <td className="total-amount">S/ {sale.totalPrice.toFixed(2)}</td>
                                                <td>
                                                    <span className="payment-badge">
                                                        {sale.paymentMethod || "Efectivo"}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>Registrar Nueva Venta</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Producto *</label>
                                    <select
                                        name="productId"
                                        value={formData.productId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Selecciona un producto</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nombre} - Stock: {p.stock} - S/ {p.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Cantidad *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleInputChange}
                                            min="1"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Descuento (%)</label>
                                        <input
                                            type="number"
                                            name="discount"
                                            value={formData.discount}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Método de Pago</label>
                                    <select
                                        name="paymentMethod"
                                        value={formData.paymentMethod}
                                        onChange={handleInputChange}
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="yape">Yape/Plin</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="isSeason"
                                            checked={formData.isSeason}
                                            onChange={handleInputChange}
                                        />
                                        <span>¿Es temporada alta?</span>
                                    </label>
                                </div>

                                {formData.productId && formData.quantity && (
                                    <div className="sale-summary">
                                        <div className="summary-row">
                                            <span>Subtotal:</span>
                                            <span>
                                                S/{" "}
                                                {(
                                                    (getProductById(parseInt(formData.productId))?.price || 0) *
                                                    formData.quantity
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        {formData.discount > 0 && (
                                            <div className="summary-row discount">
                                                <span>Descuento ({formData.discount}%):</span>
                                                <span>
                                                    - S/{" "}
                                                    {(
                                                        ((getProductById(parseInt(formData.productId))?.price || 0) *
                                                            formData.quantity *
                                                            parseFloat(formData.discount)) /
                                                        100
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="summary-row total">
                                            <strong>Total:</strong>
                                            <strong>S/ {calculateTotal().toFixed(2)}</strong>
                                        </div>
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