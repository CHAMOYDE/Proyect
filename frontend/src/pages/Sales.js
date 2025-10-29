import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesService, inventoryService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar';
import './Sales.css';

const Sales = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [formData, setFormData] = useState({ productId: '', quantity: '' });
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [editingBlocked, setEditingBlocked] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // Para colapsar sidebar

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [salesRes, productsRes] = await Promise.all([
                salesService.getSales(),
                inventoryService.getProducts()
            ]);
            const sortedSales = (salesRes.data.sales || [])
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 20);
            setSales(sortedSales);
            setProducts(productsRes.data.products || []);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setLoading(false);
        }
    };

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const openModal = () => {
        setFormData({ productId: '', quantity: '' });
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            alert(error.response?.data?.message || 'Error al registrar la venta');
        }
    };

    const handleGenerateReport = async () => {
        try {
            const response = await salesService.getSalesReport(dateRange.startDate, dateRange.endDate);
            setReportData(response.data.report);
            setShowReportModal(true);
        } catch (error) {
            alert('Error al generar el reporte');
        }
    };

    const getProductName = (productId) => {
        const product = products.find(p => p.id === productId);
        return product ? product.name : 'Desconocido';
    };

    const handleBlockEditing = () => {
        setEditingBlocked(true);
        alert('Las ventas están bloqueadas. No se permite edición.');
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        let y = 20;
        doc.setFontSize(18); doc.setTextColor(102, 126, 234); doc.text('D & R E.I.R.L.', 14, y); y += 10;
        doc.setFontSize(14); doc.setTextColor(0); doc.text('Reporte de Ventas', 14, y); y += 10;
        doc.setFontSize(10); doc.setTextColor(100); doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 14, y); y += 15;
        doc.setFontSize(12); doc.text('Resumen:', 14, y); y += 8;
        doc.setFontSize(10);
        doc.text(`Total Ventas: ${reportData.totalSales}`, 20, y); y += 6;
        doc.text(`Ingresos: S/ ${reportData.totalRevenue.toFixed(2)}`, 20, y); y += 6;
        doc.text(`Productos Vendidos: ${reportData.totalQuantity}`, 20, y); y += 15;
        doc.setFontSize(12); doc.text('Top 5 Productos:', 14, y); y += 8;
        doc.setFontSize(10);
        reportData.topProducts.forEach((p, i) => {
            doc.text(`${i + 1}. ${p.name} - Cant: ${p.quantity} - S/ ${p.revenue.toFixed(2)}`, 20, y);
            y += 6;
        });
        doc.save(`reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) return <div className="loading">Cargando...</div>;

    return (
        <div className="app-container">
            {/* Sidebar reutilizable */}
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

            {/* Contenido principal */}
            <div className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
                <header className="page-header">
                    <h1>Ventas</h1>
                    <div className="header-actions">
                        <button onClick={openModal} className="btn-primary">
                            + Nueva Venta
                        </button>
                        <button
                            onClick={handleBlockEditing}
                            className={`btn-block-edit ${editingBlocked ? 'blocked' : ''}`}
                            disabled={editingBlocked}
                        >
                            {editingBlocked ? 'Edición Bloqueada' : 'Bloquear Edición'}
                        </button>
                        <button onClick={() => setShowReportModal(true)} className="btn-report">
                            Generar Reporte
                        </button>
                    </div>
                </header>

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
                                <th>Acciones</th>
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
                                    <td>
                                        <button disabled className="btn-edit-small" title="Edición no permitida">
                                        </button>
                                    </td>
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
                                <select name="productId" value={formData.productId} onChange={handleInputChange} required>
                                    <option value="">Selecciona un producto</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} - Stock: {p.stock} - S/ {p.price}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cantidad</label>
                                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="1" required />
                            </div>
                            {formData.productId && formData.quantity && (
                                <div className="sale-summary">
                                    <p><strong>Total:</strong> S/ {(products.find(p => p.id === parseInt(formData.productId))?.price || 0) * formData.quantity}</p>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Registrar Venta</button>
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
                                <input type="date" value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Fecha Fin</label>
                                <input type="date" value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} />
                            </div>
                            <button onClick={handleGenerateReport} className="btn-primary">Generar</button>
                        </div>
                        {reportData && (
                            <>
                                <div className="report-stats">
                                    <div className="report-stat"><h4>Total Ventas</h4><p>{reportData.totalSales}</p></div>
                                    <div className="report-stat"><h4>Ingresos</h4><p>S/ {reportData.totalRevenue}</p></div>
                                    <div className="report-stat"><h4>Productos Vendidos</h4><p>{reportData.totalQuantity}</p></div>
                                </div>
                                <h4>Top 5 Productos</h4>
                                <table className="report-table">
                                    <thead><tr><th>Producto</th><th>Cantidad</th><th>Ingresos</th></tr></thead>
                                    <tbody>
                                        {reportData.topProducts.map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.name}</td>
                                                <td>{p.quantity}</td>
                                                <td>S/ {p.revenue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                        <div className="modal-actions">
                            {reportData && <button onClick={handleDownloadPDF} className="btn-download">Descargar PDF</button>}
                            <button onClick={() => setShowReportModal(false)} className="btn-secondary">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;