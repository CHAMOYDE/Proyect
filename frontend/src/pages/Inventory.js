"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { inventoryService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiChevronLeft, FiSearch, FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import Header from "../components/Header";
import "./Inventory.css";

const Inventory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: "",
    minStock: "",
    price: "",
    supplier: ""
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Prefijos de SKU por categoría
  const skuPrefixes = {
    laptop: "LAP",
    periferico: "PER",
    accesorio: "ACC",
    consumible: "CON"
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await inventoryService.getProducts();
      const productsMapped = (res.data.data || []).map((p) => ({
        id: p.id,
        name: p.nombre,
        stock: p.stock,
        minStock: p.minStock,
        price: p.price,
        sku: p.sku,
        category: p.categoria || "Otros",
        supplier: p.supplier || ""
      }));

      setProducts(productsMapped);
      setFilteredProducts(productsMapped);

      // Extraer categorías únicas
      const uniqueCategories = [...new Set(productsMapped.map(p => p.category))];
      setCategories(uniqueCategories);

      setLoading(false);
    } catch (error) {
      alert("Error al cargar productos");
      setLoading(false);
    }
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  const generateSKU = (category) => {
    const prefix = skuPrefixes[category.toLowerCase()] || "GEN";
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category || "",
        stock: product.stock,
        minStock: product.minStock,
        price: product.price,
        supplier: product.supplier || ""
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: categories[0] || "",
        stock: "",
        minStock: "",
        price: "",
        supplier: ""
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sku: editingProduct ? editingProduct.sku : generateSKU(formData.category)
      };

      if (editingProduct) {
        await inventoryService.updateProduct(editingProduct.id, payload);
      } else {
        await inventoryService.createProduct(payload);
      }
      loadProducts();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || "Error al guardar producto");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este producto?")) {
      try {
        await inventoryService.deleteProduct(id);
        loadProducts();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory("");
      setShowCategoryModal(false);
    }
  };

  const getStockColor = (stock, minStock) => {
    if (stock <= minStock) return "low";
    if (stock <= minStock * 1.5) return "medium";
    return "high";
  };

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
            <button onClick={() => navigate("/dashboard")} className="nav-item">Inicio</button>
            <button className="nav-item active">Inventario</button>
            <button onClick={() => navigate("/sales")} className="nav-item">Ventas</button>
            <button onClick={() => navigate("/predictions")} className="nav-item">Predicciones</button>
            <button onClick={() => navigate("/providers")} className="nav-item">Proveedores</button>
          </nav>

          <div className="sidebar-footer">
            <select className="user-select">
              <option>{user?.nombre || user?.rol || "Usuario"}</option>
            </select>
          </div>
        </aside>

        <div className={`content-area ${isCollapsed ? "collapsed" : ""}`}>
          <header className="page-header">
            <h1>Inventario</h1>
            <p>Lista de todos los productos</p>
            <button className="btn-new-sale" onClick={() => openModal()}>
              <FiPlus size={18} /> Nuevo Producto
            </button>
          </header>

          <div className="search-bar-container">
            <FiSearch className="search-icon" size={20} />
            <input
              type="text"
              className="search-input-styled"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Stock Mínimo</th>
                <th>Precio</th>
                <th>Proveedor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td className="sku-cell">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>
                    <span className="category-badge">{p.category}</span>
                  </td>
                  <td>
                    <span className={`stock-badge ${getStockColor(p.stock, p.minStock)}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{p.minStock}</td>
                  <td className="price-cell">S/ {parseFloat(p.price).toFixed(2)}</td>
                  <td>{p.supplier || "N/A"}</td>
                  <td className="actions-cell">
                    <button onClick={() => openModal(p)} className="btn-edit">
                      <FiEdit size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="btn-delete">
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Modal Producto */}
          {showModal && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nombre del Producto *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Categoría *</label>
                    <div className="category-input-group">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-add-category"
                        onClick={() => setShowCategoryModal(true)}
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Stock Actual *</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Stock Mínimo *</label>
                      <input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Precio de Venta *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Proveedor</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>

                  {!editingProduct && (
                    <div className="sku-preview">
                      <strong>SKU generado:</strong>{" "}
                      {formData.category ? generateSKU(formData.category) : "Selecciona una categoría"}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" onClick={closeModal} className="btn-cancel">
                      Cancelar
                    </button>
                    <button type="submit" className="btn-submit">
                      {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Nueva Categoría */}
          {showCategoryModal && (
            <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
              <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                <h3>Nueva Categoría</h3>
                <div className="form-group">
                  <label>Nombre de la Categoría</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Ej: Monitores"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="btn-cancel"
                  >
                    Cancelar
                  </button>
                  <button type="button" onClick={addNewCategory} className="btn-submit">
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Inventory;