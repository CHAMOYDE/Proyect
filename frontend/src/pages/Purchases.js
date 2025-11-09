"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { useNavigate } from "react-router-dom"
import { FiMenu, FiChevronLeft, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi"
import Header from "../components/Header"
import "./Sales.css"

const Purchases = () => {
    const { user } = useAuth()
    const { theme } = useTheme()
    const navigate = useNavigate()
    const [purchases, setPurchases] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ item: "", quantity: "", estimatedCost: "" })
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        // Load purchases from localStorage or backend
        const savedPurchases = localStorage.getItem("purchases")
        if (savedPurchases) {
            setPurchases(JSON.parse(savedPurchases))
        }
    }, [])

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)

    const openModal = () => {
        setFormData({ item: "", quantity: "", estimatedCost: "" })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const newPurchase = {
            id: Date.now(),
            ...formData,
            date: new Date().toLocaleDateString(),
            status: "Pendiente",
        }
        const updated = [...purchases, newPurchase]
        setPurchases(updated)
        localStorage.setItem("purchases", JSON.stringify(updated))
        closeModal()
    }

    const handleDelete = (id) => {
        const updated = purchases.filter((p) => p.id !== id)
        setPurchases(updated)
        localStorage.setItem("purchases", JSON.stringify(updated))
    }

    const getStatusStyle = (status) => {
        if (status === "Completada") return "completed"
        if (status === "Pendiente") return "pending"
        return "pending"
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
                        <button onClick={() => navigate("/sales")} className="nav-item">
                            Ventas
                        </button>
                        <button onClick={() => navigate("/predictions")} className="nav-item">
                            Predicciones
                        </button>
                        <button className="nav-item active">Lista de Compras</button>

                        <button onClick={() => navigate("/providers")} className="nav-item">
                            Proveedores
                        </button>
                    </nav>
                </aside>

                <div className={`content-area ${isCollapsed ? "collapsed" : ""}`}>
                    <header className="page-header">
                        <div className="title-section">
                            <h1>Lista de Compras</h1>
                            <p>Total de ítems pendientes: {purchases.filter((p) => p.status === "Pendiente").length}</p>
                        </div>
                        <button onClick={openModal} className="btn-new-sale">
                            <FiPlus size={16} /> Agregar Ítem
                        </button>
                    </header>

                    <div className="table-container">
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Ítem</th>
                                    <th>Cantidad</th>
                                    <th>Costo Estimado</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="no-data">
                                            No hay ítems en la lista de compras
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.map((purchase) => (
                                        <tr key={purchase.id}>
                                            <td>{purchase.date}</td>
                                            <td>{purchase.item}</td>
                                            <td>{purchase.quantity}</td>
                                            <td className="total-amount">S/ {purchase.estimatedCost}</td>
                                            <td>
                                                <span className={`status ${getStatusStyle(purchase.status)}`}>{purchase.status}</span>
                                            </td>
                                            <td className="actions">
                                                <button className="btn-edit-small" title="Editar">
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(purchase.id)} className="btn-delete-small" title="Eliminar">
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>Agregar Ítem a la Lista</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Nombre del Ítem</label>
                                    <input
                                        type="text"
                                        name="item"
                                        value={formData.item}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Teclado Mecánico"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Cantidad</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        placeholder="Ej: 10"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Costo Estimado</label>
                                    <input
                                        type="number"
                                        name="estimatedCost"
                                        value={formData.estimatedCost}
                                        onChange={handleInputChange}
                                        placeholder="Ej: 200.50"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={closeModal} className="btn-cancel">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        Agregar Ítem
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

export default Purchases
