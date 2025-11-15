"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Header from "../components/Header"
import { FiEdit, FiTrash2, FiPlus, FiMenu, FiChevronLeft, FiPackage, FiPhone, FiMail, FiUser } from "react-icons/fi"
import "./Providers.css"

const Providers = () => {
    const [providers, setProviders] = useState([])
    const [selectedProvider, setSelectedProvider] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingProvider, setEditingProvider] = useState(null)
    const [formData, setFormData] = useState({ nombre: "", contacto: "", telefono: "", correo: "" })
    const navigate = useNavigate()
    const { user } = useAuth()

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
                setProviders(data.providers)
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
                setProducts(data.products)
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
                correo: provider.correo || "",
            })
        } else {
            setEditingProvider(null)
            setFormData({ nombre: "", contacto: "", telefono: "", correo: "" })
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
            <Header isCollapsed={isCollapsed} />
            <div className="dashboard-wrapper">
                <aside className={`sidebar ${isCollapsed ? "closed" : "open"}`}>
                    <div className="sidebar-header">
                        <div className="logo-container">
                            <img src="/as.png" alt="Logo" className="logo---image" />
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
                        <button className="nav-item active">Proveedores</button>
                    </nav>
                </aside>

                <div className={`content-area ${isCollapsed ? "collapsed" : ""}`}>
                    {!selectedProvider ? (
                        <>
                            <header className="page-header">
                                <div className="title-section">
                                    <h1>Gestión de Proveedores</h1>
                                    <p>Administra los proveedores y sus productos</p>
                                </div>
                                <button onClick={() => openModal()} className="btn-new-provider">
                                    <FiPlus size={18} /> Nuevo Proveedor
                                </button>
                            </header>

                            {loading ? (
                                <div className="loading-state">Cargando proveedores...</div>
                            ) : providers.length > 0 ? (
                                <div className="providers-grid">
                                    {providers.map((provider) => (
                                        <div key={provider.id} className="provider-card">
                                            <div className="provider-header">
                                                <div className="provider-icon">
                                                    <FiPackage size={28} />
                                                </div>
                                                <h3>{provider.nombre}</h3>
                                            </div>

                                            <div className="provider-info">
                                                {provider.contacto && (
                                                    <div className="info-row">
                                                        <FiUser size={16} />
                                                        <span>{provider.contacto}</span>
                                                    </div>
                                                )}
                                                {provider.telefono && (
                                                    <div className="info-row">
                                                        <FiPhone size={16} />
                                                        <span>{provider.telefono}</span>
                                                    </div>
                                                )}
                                                {provider.correo && (
                                                    <div className="info-row">
                                                        <FiMail size={16} />
                                                        <span>{provider.correo}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="provider-stats">
                                                <span className="stat-badge">{provider.total_productos} productos</span>
                                            </div>

                                            <div className="provider-actions">
                                                <button className="btn-view" onClick={() => fetchProductsByProvider(provider.nombre)}>
                                                    Ver Productos
                                                </button>
                                                <button className="btn-edit-icon" onClick={() => openModal(provider)} title="Editar">
                                                    <FiEdit size={16} />
                                                </button>
                                                <button
                                                    className="btn-delete-icon"
                                                    onClick={() => handleDelete(provider.nombre)}
                                                    title="Eliminar"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-data-state">
                                    <FiPackage size={64} />
                                    <p>No hay proveedores registrados</p>
                                    <button onClick={() => openModal()} className="btn-add-first">
                                        Agregar Primer Proveedor
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <header className="page-header">
                                <div className="title-section">
                                    <button className="back-btn" onClick={() => setSelectedProvider(null)}>
                                        ← Volver
                                    </button>
                                    <h1>Productos de {selectedProvider}</h1>
                                    <p>Total: {products.length} productos</p>
                                </div>
                            </header>

                            {loading ? (
                                <div className="loading-state">Cargando productos...</div>
                            ) : (
                                <div className="products-table-container">
                                    <table className="products-table">
                                        <thead>
                                            <tr>
                                                <th>SKU</th>
                                                <th>Producto</th>
                                                <th>Categoría</th>
                                                <th>Precio</th>
                                                <th>Stock</th>
                                                <th>Stock Mínimo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((product) => (
                                                <tr key={product.id}>
                                                    <td className="sku-cell">{product.sku}</td>
                                                    <td className="product-name">{product.nombre}</td>
                                                    <td>
                                                        <span className="category-badge">{product.categoria}</span>
                                                    </td>
                                                    <td className="price-cell">S/ {Number.parseFloat(product.price).toFixed(2)}</td>
                                                    <td className="text-center">
                                                        <span className={`stock-indicator ${product.stock <= product.minStock ? "low" : "normal"}`}>
                                                            {product.stock}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">{product.minStock}</td>
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
                                <label>Nombre del Proveedor *</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Persona de Contacto</label>
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
                                <label>Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={formData.correo}
                                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
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
