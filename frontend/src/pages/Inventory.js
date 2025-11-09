"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { inventoryService } from "../services/api"
import { useNavigate } from "react-router-dom"
import { FiMenu, FiChevronLeft, FiSearch, FiFilter, FiEdit, FiTrash2, FiPackage } from "react-icons/fi"
import Header from "../components/Header"
import "./Inventory.css"

const Inventory = () => {
    const { user } = useAuth()
    const { theme } = useTheme()
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState({ sku: "", name: "", category: "", stock: "", minStock: "", price: "" })
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            const res = await inventoryService.getProducts()
            const productsWithId = (res.data.products || []).map((p, i) => ({
                ...p,
                id: p.id || i + 1,
                sku: p.sku || `SKU-${String(i + 1).padStart(3, "0")}`,
            }))
            setProducts(productsWithId)
            setFilteredProducts(productsWithId)
            setLoading(false)
        } catch (error) {
            alert("Error al cargar productos")
            setLoading(false)
        }
    }

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase()
        setSearchTerm(term)
        const filtered = products.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
        setFilteredProducts(filtered)
    }

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product)
            setFormData({
                sku: product.sku,
                name: product.name,
                category: product.category || "Productos",
                stock: product.stock,
                minStock: product.minStock,
                price: product.price,
            })
        } else {
            setEditingProduct(null)
            setFormData({ sku: "", name: "", category: "Productos", stock: "", minStock: "", price: "" })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingProduct(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingProduct) {
                await inventoryService.updateProduct(editingProduct.id, formData)
            } else {
                await inventoryService.createProduct(formData)
            }
            loadProducts()
            closeModal()
        } catch (error) {
            alert(error.response?.data?.message || "Error al guardar producto")
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm("¿Eliminar este producto?")) {
            try {
                await inventoryService.deleteProduct(id)
                loadProducts()
            } catch (error) {
                alert("Error al eliminar")
            }
        }
    }

    const getStockColor = (stock, minStock) => {
        if (stock <= minStock) return "low"
        if (stock <= minStock * 1.5) return "medium"
        return "high"
    }

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
                        <button className="nav-item active">Inventario</button>
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

                {/* CONTENIDO */}
                <div className={`content-area ${isCollapsed ? "collapsed" : ""}`}>
                    <header className="page-header">
                        <div className="title-section">
                            <h1>Gestión de Inventario</h1>
                            <p>Total de productos: {products.length}</p>
                        </div>
                        <button onClick={() => openModal()} className="btn-new-product">
                            + Crear Producto
                        </button>
                    </header>

                    {/* BARRA DE BÚSQUEDA */}
                    <div className="search-bar">
                        <div className="search-input-wrapper">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o SKU..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="search-input"
                            />
                        </div>
                        <button className="btn-filter">
                            <FiFilter size={18} /> Filtrar
                        </button>
                    </div>

                    {/* TABLA */}
                    <div className="table-container">
                        <table className="inventory-table">
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Stock Actual</th>
                                    <th>Mínimo</th>
                                    <th>Precio</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="no-data">
                                            No se encontraron productos
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((p) => (
                                        <tr key={p.id}>
                                            <td className="sku">{p.sku}</td>
                                            <td className="product-name">{p.name}</td>
                                            <td>{p.category || "Alimentos"}</td>
                                            <td>
                                                <span className={`stock-badge ${getStockColor(p.stock, p.minStock)}`}>{p.stock}</span>
                                            </td>
                                            <td>{p.minStock}</td>
                                            <td>S/ {Number.parseFloat(p.price).toFixed(2)}</td>
                                            <td className="actions">
                                                <button onClick={() => openModal(p)} className="btn-edit" title="Editar">
                                                    <FiEdit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(p.id)} className="btn-delete" title="Eliminar">
                                                    <FiTrash2 size={16} />
                                                </button>
                                                <button className="btn-stock" title="Ajustar Stock">
                                                    <FiPackage size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingProduct ? "Editar Producto" : "Crear Producto"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>SKU</label>
                                    <input
                                        name="sku"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>Teclados</option>
                                        <option>Laptods</option>
                                        <option>Mouses</option>
                                        <option>Procesadores</option>
                                        <option>Monitores</option>
                                        <option>Cases</option>
                                        <option>Otros</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Stock Actual</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stock Mínimo</label>
                                    <input
                                        type="number"
                                        name="minStock"
                                        value={formData.minStock}
                                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Precio</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn-cancel">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    {editingProduct ? "Actualizar" : "Crear"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default Inventory
