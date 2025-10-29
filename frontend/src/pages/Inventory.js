import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Inventory.css';

const Inventory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        stock: '',
        minStock: '',
        price: '',
        expiryDate: '',
        supplier: ''
    });
    const [isCollapsed, setIsCollapsed] = useState(false); // Para colapsar sidebar

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await inventoryService.getProducts();
            const productsList = Array.isArray(response.data.products)
                ? response.data.products
                : [];
            setProducts(productsList);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            setProducts([]);
            setLoading(false);
        }
    };

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                sku: '',
                category: '',
                stock: '',
                minStock: '',
                price: '',
                expiryDate: '',
                supplier: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await inventoryService.updateProduct(editingProduct.id, formData);
            } else {
                await inventoryService.createProduct(formData);
            }
            loadProducts();
            closeModal();
        } catch (error) {
            console.error('Error al guardar producto:', error);
            alert('Error al guardar el producto');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                await inventoryService.deleteProduct(id);
                loadProducts();
            } catch (error) {
                console.error('Error al eliminar producto:', error);
                alert('Error al eliminar el producto');
            }
        }
    };

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="app-container">
            {/* Sidebar reutilizable */}
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

            {/* Contenido principal */}
            <div className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
                <header className="page-header">
                    <h1>Inventario de Productos</h1>
                </header>

                <div className="inventory-content">
                    <div className="header">
                        {/* BOTÓN SIEMPRE VISIBLE PARA TODOS */}
                        <button onClick={() => openModal()} className="btn-primary">
                            + Nuevo Producto
                        </button>
                    </div>

                    <div className="products-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Stock</th>
                                    <th>Mín. Stock</th>
                                    <th>Precio</th>
                                    <th>Proveedor</th>
                                    <th>Vencimiento</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(products) && products.length > 0 ? (
                                    products.map(product => (
                                        <tr key={product.id} className={product.stock < product.minStock ? 'low-stock' : ''}>
                                            <td>{product.sku}</td>
                                            <td>{product.name}</td>
                                            <td>{product.category}</td>
                                            <td>{product.stock}</td>
                                            <td>{product.minStock}</td>
                                            <td>S/ {product.price}</td>
                                            <td>{product.supplier}</td>
                                            <td>{product.expiryDate || 'N/A'}</td>
                                            <td className="actions">
                                                <button onClick={() => openModal(product)} className="btn-edit">
                                                    Editar
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} className="btn-delete">
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                                            No hay productos en el inventario
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Proveedor</label>
                                    <input
                                        type="text"
                                        name="supplier"
                                        value={formData.supplier}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stock Mínimo</label>
                                    <input
                                        type="number"
                                        name="minStock"
                                        value={formData.minStock}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Precio</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha de Vencimiento</label>
                                    <input
                                        type="date"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingProduct ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;