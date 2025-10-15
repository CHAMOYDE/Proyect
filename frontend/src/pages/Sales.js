import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesService, inventoryService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Sales.css';

const Sales = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [formData, setFormData] = useState({
        productId: '',
        quantity: ''
    });
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [salesRes, productsRes] = await Promise.all([
                salesService.getSales(),
                inventoryService.getProducts()
            ]);
            setSales(salesRes.data.sales);
            setProducts(productsRes.data.products);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const openModal = () => {
        setFormData({ productId: '', quantity: '' });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
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
            await salesService.createSale({
                productId: parseInt(formData.productId),
                quantity: parseInt(formData.quantity)
            });
            loadData();
            closeModal();
            alert('Venta registrada exitosamente');
        } catch (error) {
            console.error('Error al registrar venta:', error);
            alert(error.response?.data?.message || 'Error al registrar la venta');
        }
    };

    const handleGenerateReport = async () => {
        try {
            const response = await salesService.getSalesReport(
                dateRange.startDate,
                dateRange.endDate
            );
            setReportData(response.data.report);
            setShowReportModal(true);
        } catch (error) {
            console.error('Error al generar reporte:', error);
            alert('Error al generar el reporte');
        }
    };

    const getProductName = (productId) => {
        const product = products.find(p => p.id === productId);
        return product ? product.name : 'Desconocido';
    };

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        let yPosition = 20;

        // Título
        doc.setFontSize(18);
        doc.setTextColor(102, 126, 234);
        doc.text('D & R E.I.R.L.', 14, yPosition);
        yPosition += 10;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Reporte de Ventas', 14, yPosition);
        yPosition += 10;

        // Fecha
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 14, yPosition);
        yPosition += 15;

        // Estadísticas
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Resumen:', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.text(`Total Ventas: ${reportData.totalSales}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Ingresos: S/ ${reportData.totalRevenue.toFixed(2)}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Productos Vendidos: ${reportData.totalQuantity}`, 20, yPosition);
        yPosition += 15;

        // Top Productos
        doc.setFontSize(12);
        doc.text('Top 5 Productos:', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        reportData.topProducts.forEach((product, index) => {
            doc.text(
                `${index + 1}. ${product.name} - Cant: ${product.quantity} - S/ ${product.revenue.toFixed(2)}`,
                20,
                yPosition
            );
            yPosition += 6;
        });

        // Guardar
        const fileName = `reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    return (
        <div className="sales">
            <nav className="navbar">
                <h1>D & R E.I.R.L.</h1>
                <div className="nav-links">
                    <button onClick={() => navigate('/dashboard')}>Dashboard</button>
                    <button onClick={() => navigate('/inventory')}>Inventario</button>
                    <button onClick={() => navigate('/sales')} className="active">Ventas</button>
                    <button onClick={() => navigate('/predictions')}>Predicciones</button>
                </div>
                <div className="user-info">
                    <span>Bienvenido, {user?.name}</span>
                    <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
                </div>
            </nav>

            <div className="sales-content">
                <div className="header">
                    <h2>Registro de Ventas</h2>
                    <div className="header-actions">
                        <button onClick={openModal} className="btn-primary">
                            + Nueva Venta
                        </button>
                        <button onClick={() => setShowReportModal(true)} className="btn-report">
                            📊 Generar Reporte
                        </button>
                    </div>
                </div>

                <div className="sales-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Total</th>
                                <th>Fecha</th>
                                <th>Vendedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => (
                                <tr key={sale.id}>
                                    <td>{sale.id}</td>
                                    <td>{sale.productName || getProductName(sale.productId)}</td>
                                    <td>{sale.quantity}</td>
                                    <td>S/ {sale.totalPrice}</td>
                                    <td>{sale.date}</td>
                                    <td>{sale.seller}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Nueva Venta */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Registrar Nueva Venta</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Producto</label>
                                <select
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Selecciona un producto</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} - Stock: {product.stock} - S/ {product.price}
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
                                    <p><strong>Total:</strong> S/ {
                                        (products.find(p => p.id === parseInt(formData.productId))?.price || 0) * formData.quantity
                                    }</p>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Registrar Venta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Reporte */}
            {showReportModal && (
                <div className="modal">
                    <div className="modal-content modal-large">
                        <h3>Reporte de Ventas</h3>

                        <div className="date-filters">
                            <div className="form-group">
                                <label>Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha Fin</label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                />
                            </div>
                            <button onClick={handleGenerateReport} className="btn-primary">
                                Generar
                            </button>
                        </div>

                        {reportData && (
                            <div className="report-content">
                                <div className="report-stats">
                                    <div className="report-stat">
                                        <h4>Total Ventas</h4>
                                        <p>{reportData.totalSales}</p>
                                    </div>
                                    <div className="report-stat">
                                        <h4>Ingresos Totales</h4>
                                        <p>S/ {reportData.totalRevenue}</p>
                                    </div>
                                    <div className="report-stat">
                                        <h4>Productos Vendidos</h4>
                                        <p>{reportData.totalQuantity}</p>
                                    </div>
                                </div>

                                <h4>Top 5 Productos Más Vendidos</h4>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Ingresos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.topProducts.map((product, index) => (
                                            <tr key={index}>
                                                <td>{product.name}</td>
                                                <td>{product.quantity}</td>
                                                <td>S/ {product.revenue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="modal-actions">
                            {reportData && (
                                <button onClick={handleDownloadPDF} className="btn-download">
                                    📥 Descargar PDF
                                </button>
                            )}
                            <button onClick={() => setShowReportModal(false)} className="btn-secondary">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;