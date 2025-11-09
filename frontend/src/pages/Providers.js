"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import { FiEdit, FiTrash2, FiPlus, FiMenu, FiChevronLeft } from "react-icons/fi"
import "./Sales.css"

const Providers = () => {
    const [providers, setProviders] = useState([])
    const [selectedProvider, setSelectedProvider] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingProvider, setEditingProvider] = useState(null)
    const [formData, setFormData] = useState({ nombre: "", contacto: "", telefono: "", email: "" })
    const navigate = useNavigate()

    useEffect(() => {
        fetchProviders()
    }, [])

    const fetchProviders = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5000/api/providers", {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            if (data.success) {
                setProviders(data.data)
            }
        } catch (error) {
            console.error("Error obteniendo proveedores:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchProductsByProvider = async (providerName) => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`http://localhost:5000/api/providers/${encodeURIComponent(providerName)}/products`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            if (data.success) {
                setProducts(data.data)
                setSelectedProvider(providerName)
            }
        } catch (error) {
            console.error("Error obteniendo productos:", error)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (provider = null) => {
        if (provider) {
            setEditingProvider(provider)
            setFormData({
                nombre: provider.nombre,
                contacto: provider.contacto || "",
                telefono: provider.telefono || "",
                email: provider.email || "",
            })
        } else {
            setEditingProvider(null)
            setFormData({ nombre: "", contacto: "", telefono: "", email: "" })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingProvider(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem("token")
            let response

            if (editingProvider) {
                response = await fetch(`http://localhost:5000/api/providers/${encodeURIComponent(editingProvider.nombre)}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                })
            } else {
                response = await fetch("http://localhost:5000/api/providers", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                })
            }

            const data = await response.json()
            if (data.success) {
                fetchProviders()
                closeModal()
            } else {
                alert(data.message || "Error al guardar proveedor")
            }
        } catch (error) {
            alert("Error al guardar proveedor")
        }
    }

    const handleDelete = async (nombre) => {
        if (window.confirm(`¿Eliminar el proveedor "${nombre}"?`)) {
            try {
                const token = localStorage.getItem("token")
                const response = await fetch(`http://localhost:5000/api/providers/${encodeURIComponent(nombre)}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                })

                const data = await response.json()
                if (data.success) {
                    fetchProviders()
                } else {
                    alert(data.message || "Error al eliminar proveedor")
                }
            } catch (error) {
                alert("Error al eliminar proveedor")
            }
        }
    }

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)

    return (
        <>
            <Header />
            <div className="dashboard-wrapper">
                {/* SIDEBAR */}
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
                        <button onClick={() => navigate("/purchases")} className="nav-item">
                            Lista de Compras
                        </button>
                        <button className="nav-item active">Proveedores</button>
                    </nav>
                </aside>

                {/* CONTENIDO */}
                <div className={`content-area ${isCollapsed ? "collapsed" : ""}`}>
                    {!selectedProvider ? (
                        <>
                            <header className="page-header">
                                <div className="title-section">
                                    <h1>Gestión de Proveedores</h1>
                                    <p>Administra los proveedores de tu empresa</p>
                                </div>
                                <button onClick={() => openModal()} className="btn-new-sale">
                                    <FiPlus size={18} /> Nuevo Proveedor
                                </button>
                            </header>

                            {loading ? (
                                <div className="loading">Cargando proveedores...</div>
                            ) : providers.length > 0 ? (
                                <div className="providers-table">
                                    <table className="table-styled">
                                        <thead>
                                            <tr>
                                                <th>Proveedor</th>
                                                <th>Productos</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {providers.map((provider) => (
                                                <tr key={provider.nombre}>
                                                    <td
                                                        className="provider-name-cell"
                                                        onClick={() => fetchProductsByProvider(provider.nombre)}
                                                        style={{ cursor: "pointer", color: "#00c8ff", fontWeight: "500" }}
                                                    >
                                                        {provider.nombre}
                                                    </td>
                                                    <td>{provider.total_productos}</td>
                                                    <td className="actions-cell">
                                                        <button className="btn-edit-small" onClick={() => openModal(provider)} title="Editar">
                                                            <FiEdit size={16} />
                                                        </button>
                                                        <button
                                                            className="btn-delete-small"
                                                            onClick={() => handleDelete(provider.nombre)}
                                                            title="Eliminar"
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="no-data">No hay proveedores registrados</div>
                            )}
                        </>
                    ) : (
                        <>
                            <header className="page-header">
                                <div className="title-section">
                                    <button className="back-btn-alt" onClick={() => setSelectedProvider(null)}>
                                        ← Volver
                                    </button>
                                    <h1>Productos de {selectedProvider}</h1>
                                    <p>Total: {products.length} productos</p>
                                </div>
                            </header>

                            {loading ? (
                                <div className="loading">Cargando productos...</div>
                            ) : (
                                <div className="table-wrapper">
                                    <table className="table-styled">
                                        <thead>
                                            <tr>
                                                <th>SKU</th>
                                                <th>Producto</th>
                                                <th>Categoría</th>
                                                <th>Precio</th>
                                                <th>Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((product) => (
                                                <tr key={product.sku}>
                                                    <td>{product.sku}</td>
                                                    <td>{product.nombre}</td>
                                                    <td>{product.categoria}</td>
                                                    <td>S/ {product.price}</td>
                                                    <td>{product.stock}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingProvider ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Contacto</label>
                                <input
                                    type="text"
                                    value={formData.contacto}
                                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn-cancel">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    {editingProvider ? "Actualizar" : "Crear"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default Providers
