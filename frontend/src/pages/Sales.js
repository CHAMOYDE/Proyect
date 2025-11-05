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
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let y = 20;

        // ========== ENCABEZADO CON DISEÑO PROFESIONAL ==========
        // Rectángulo de fondo para el header
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, pageWidth, 45, 'F');

        // Logo/Nombre de la empresa (blanco)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('SOLUCIONES TECNOLÓGICAS E INFORMÁTICAS', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(16);
        doc.text('D & R E.I.R.L.', pageWidth / 2, 25, { align: 'center' });

        // RUC y datos de contacto
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('RUC: 20611214856 | Tel:922518956 | serviciotecnicoroger@gmail.com', pageWidth / 2, 35, { align: 'center' });

        // Línea decorativa
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(14, 40, pageWidth - 14, 40);

        y = 55;

        // ========== TÍTULO DEL REPORTE ==========
        doc.setTextColor(102, 126, 234);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('REPORTE DE VENTAS', 14, y);
        y += 3;

        // Línea debajo del título
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(1);
        doc.line(14, y, 80, y);
        y += 10;

        // ========== INFORMACIÓN DEL REPORTE ==========
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        const reportInfo = [
            ['Fecha de generación:', new Date().toLocaleString('es-PE', {
                dateStyle: 'full',
                timeStyle: 'short'
            })],
            ['Generado por:', user?.name || 'Sistema'],
            ['Período:', dateRange.startDate && dateRange.endDate
                ? `${dateRange.startDate} al ${dateRange.endDate}`
                : 'Todos los registros']
        ];

        reportInfo.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 14, y);
            doc.setFont(undefined, 'normal');
            doc.text(value, 70, y);
            y += 6;
        });

        y += 8;

        // ========== RESUMEN EJECUTIVO CON CAJAS ==========
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('RESUMEN EJECUTIVO', 14, y);
        y += 8;

        // Cajas de estadísticas
        const boxWidth = (pageWidth - 42) / 3;
        const boxHeight = 25;
        const startX = 14;

        const stats = [
            { label: 'TOTAL VENTAS', value: reportData.totalSales, color: [102, 126, 234] },
            { label: 'INGRESOS TOTALES', value: `S/ ${reportData.totalRevenue.toFixed(2)}`, color: [0, 204, 102] },
            { label: 'PRODUCTOS VENDIDOS', value: reportData.totalQuantity, color: [255, 170, 0] }
        ];

        stats.forEach((stat, index) => {
            const boxX = startX + (boxWidth + 7) * index;

            // Caja con borde
            doc.setDrawColor(stat.color[0], stat.color[1], stat.color[2]);
            doc.setLineWidth(0.5);
            doc.setFillColor(250, 250, 255);
            doc.roundedRect(boxX, y, boxWidth, boxHeight, 3, 3, 'FD');

            // Label
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'normal');
            doc.text(stat.label, boxX + boxWidth / 2, y + 8, { align: 'center' });

            // Valor
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
            doc.text(String(stat.value), boxX + boxWidth / 2, y + 18, { align: 'center' });
        });

        y += boxHeight + 15;

        // ========== TOP 5 PRODUCTOS ==========
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('TOP 5 PRODUCTOS MÁS VENDIDOS', 14, y);
        y += 8;

        // Tabla de top productos
        const tableStartY = y;
        const colWidths = [100, 40, 45];
        const rowHeight = 8;

        // Header de la tabla
        doc.setFillColor(102, 126, 234);
        doc.rect(14, y, pageWidth - 28, rowHeight, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('PRODUCTO', 16, y + 5.5);
        doc.text('CANTIDAD', 116, y + 5.5);
        doc.text('INGRESOS (S/)', 156, y + 5.5);

        y += rowHeight;

        // Filas de datos
        doc.setTextColor(50, 50, 50);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);

        reportData.topProducts.forEach((product, index) => {
            // Alternar color de fondo
            if (index % 2 === 0) {
                doc.setFillColor(245, 247, 255);
                doc.rect(14, y, pageWidth - 28, rowHeight, 'F');
            }

            // Truncar nombre si es muy largo
            const productName = product.name.length > 35
                ? product.name.substring(0, 32) + '...'
                : product.name;

            doc.text(productName, 16, y + 5.5);
            doc.text(String(product.quantity), 116, y + 5.5);
            doc.text(product.revenue.toFixed(2), 156, y + 5.5);

            y += rowHeight;
        });

        // Borde de la tabla
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.rect(14, tableStartY, pageWidth - 28, y - tableStartY);

        y += 10;

        // ========== DETALLE DE VENTAS (si hay espacio) ==========
        if (reportData.sales && reportData.sales.length > 0 && y < pageHeight - 60) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(102, 126, 234);
            doc.text('DETALLE DE VENTAS RECIENTES', 14, y);
            y += 8;

            const salesTableStartY = y;
            const salesRowHeight = 7;

            // Header
            doc.setFillColor(102, 126, 234);
            doc.rect(14, y, pageWidth - 28, salesRowHeight, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.text('ID', 16, y + 4.5);
            doc.text('PRODUCTO', 30, y + 4.5);
            doc.text('CANT.', 100, y + 4.5);
            doc.text('TOTAL', 120, y + 4.5);
            doc.text('FECHA', 145, y + 4.5);
            doc.text('VENDEDOR', 170, y + 4.5);

            y += salesRowHeight;

            // Mostrar solo las últimas 10 ventas
            const recentSales = reportData.sales.slice(0, 10);
            doc.setTextColor(50, 50, 50);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);

            recentSales.forEach((sale, index) => {
                // Verificar si necesitamos nueva página
                if (y > pageHeight - 30) {
                    doc.addPage();
                    y = 20;
                }

                if (index % 2 === 0) {
                    doc.setFillColor(245, 247, 255);
                    doc.rect(14, y, pageWidth - 28, salesRowHeight, 'F');
                }

                const productName = (sale.productName || '').length > 20
                    ? (sale.productName || '').substring(0, 17) + '...'
                    : (sale.productName || 'N/A');

                doc.text(String(sale.id), 16, y + 4.5);
                doc.text(productName, 30, y + 4.5);
                doc.text(String(sale.quantity), 100, y + 4.5);
                doc.text(`S/ ${sale.totalPrice.toFixed(2)}`, 120, y + 4.5);
                doc.text(sale.date || 'N/A', 145, y + 4.5);
                doc.text((sale.seller || 'N/A').substring(0, 15), 170, y + 4.5);

                y += salesRowHeight;
            });

            // Borde de la tabla
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            const tableHeight = y - salesTableStartY;
            doc.rect(14, salesTableStartY, pageWidth - 28, tableHeight);
        }

        // ========== PIE DE PÁGINA ==========
        const footerY = pageHeight - 20;

        // Línea superior del footer
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(0.5);
        doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text('Este documento ha sido generado automáticamente por el Sistema de Gestión de Inventarios',
            pageWidth / 2, footerY, { align: 'center' });

        doc.setFont(undefined, 'normal');
        doc.text(`Página 1 | ${new Date().toLocaleDateString('es-PE')}`,
            pageWidth / 2, footerY + 5, { align: 'center' });

        // ========== GUARDAR PDF ==========
        const fileName = `Reporte_Ventas_DyR_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
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