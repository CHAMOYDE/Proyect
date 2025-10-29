import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { predictionsService, inventoryService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Predictions.css';

const Predictions = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [predictions, setPredictions] = useState([]);
    const [trends, setTrends] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [days, setDays] = useState(30);
    const [selectedPrediction, setSelectedPrediction] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true); // Para colapsar

    const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [predictionsRes, trendsRes, productsRes] = await Promise.all([
                predictionsService.getPredictions(),
                predictionsService.getTrends(),
                inventoryService.getProducts()
            ]);
            setPredictions(predictionsRes.data.predictions);
            setTrends(trendsRes.data.trends);
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

    const handleProductSearch = async () => {
        if (!selectedProduct) return;

        try {
            const response = await predictionsService.getPredictions(selectedProduct, days);
            setSelectedPrediction(response.data.prediction);
        } catch (error) {
            console.error('Error al obtener predicción:', error);
            alert('Error al obtener la predicción');
        }
    };

    const trendChartData = trends.slice(0, 5).map(trend => ({
        name: trend.productName.substring(0, 15) + '...',
        ventas: trend.totalQuantity,
        ingresos: trend.totalRevenue
    }));

    const priorityData = [
        { name: 'Alta', value: predictions.filter(p => p.priority === 'Alta').length, color: '#ff4444' },
        { name: 'Media', value: predictions.filter(p => p.priority === 'Media').length, color: '#ffaa00' },
        { name: 'Baja', value: predictions.filter(p => p.priority === 'Baja').length, color: '#00cc66' }
    ].filter(item => item.value > 0);

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="predictions-layout">
            {/* Sidebar Izquierdo */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <h2>D & R</h2>
                    <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? '←' : '→'}
                    </button>
                </div>
                <nav className="sidebar-nav">
                    <button onClick={() => navigate('/dashboard')} className="nav-item">
                        Dashboard
                    </button>
                    <button onClick={() => navigate('/inventory')} className="nav-item">
                        Inventario
                    </button>
                    <button onClick={() => navigate('/sales')} className="nav-item">
                        Ventas
                    </button>
                    <button onClick={() => navigate('/predictions')} className="nav-item active">
                        Predicciones
                    </button>
                </nav>
                <div className="sidebar-footer">
                    <span>Bienvenido, {user?.name}</span>
                    <button onClick={handleLogout} className="logout-btn-sidebar">
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="main-content">
                <header className="page-header">
                    <h1>Predicciones y Análisis con IA</h1>
                </header>

                {/* Búsqueda de predicción específica */}
                <div className="prediction-search">
                    <h3>Predicción por Producto</h3>
                    <div className="search-form">
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                            <option value="">Selecciona un producto</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} - Stock: {product.stock}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            placeholder="Días a predecir"
                            min="1"
                            max="365"
                        />
                        <button onClick={handleProductSearch} className="btn-primary">
                            Predecir
                        </button>
                    </div>

                    {selectedPrediction && (
                        <div className="prediction-result">
                            <div className="prediction-card">
                                <h4>{selectedPrediction.productName}</h4>
                                <div className="prediction-stats">
                                    <div className="stat">
                                        <span className="label">Stock Actual</span>
                                        <span className="value">{selectedPrediction.currentStock}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="label">Ventas Diarias Promedio</span>
                                        <span className="value">{selectedPrediction.avgDailySales}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="label">Demanda Predicha ({days} días)</span>
                                        <span className="value highlight">{selectedPrediction.predictedDemand}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="label">Días hasta agotamiento</span>
                                        <span className={`value ${selectedPrediction.daysUntilStockout < 7 ? 'danger' : ''}`}>
                                            {selectedPrediction.daysUntilStockout}
                                        </span>
                                    </div>
                                    <div className="stat full-width">
                                        <span className="label">Recomendación de Pedido</span>
                                        <span className="value success">{selectedPrediction.recommendedOrder} unidades</span>
                                    </div>
                                </div>
                                <div className={`alert-badge ${selectedPrediction.daysUntilStockout < 7 ? 'danger' : selectedPrediction.daysUntilStockout < 15 ? 'warning' : 'success'}`}>
                                    {selectedPrediction.alert || 'Stock adecuado'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gráficas */}
                <div className="charts-grid">
                    <div className="chart-card">
                        <h3>Tendencias de Ventas (Top 5)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={trendChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="ventas" fill="#667eea" name="Cantidad Vendida" />
                                <Bar dataKey="ingresos" fill="#764ba2" name="Ingresos (S/)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                        <h3>Distribución de Prioridades</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={priorityData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tabla de Predicciones */}
                <div className="predictions-table">
                    <h3>Predicciones de Demanda</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Stock Actual</th>
                                <th>Venta Diaria Prom.</th>
                                <th>Demanda Predicha (30d)</th>
                                <th>Días hasta agotamiento</th>
                                <th>Pedido Recomendado</th>
                                <th>Prioridad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((pred, index) => (
                                <tr key={index} className={`priority-${pred.priority.toLowerCase()}`}>
                                    <td>{pred.productName}</td>
                                    <td>{pred.currentStock}</td>
                                    <td>{pred.avgDailySales}</td>
                                    <td><strong>{pred.predictedDemand}</strong></td>
                                    <td className={pred.daysUntilStockout < 7 ? 'danger' : pred.daysUntilStockout < 15 ? 'warning' : ''}>
                                        {pred.daysUntilStockout}
                                    </td>
                                    <td>{pred.recommendedOrder}</td>
                                    <td>
                                        <span className={`badge badge-${pred.priority.toLowerCase()}`}>
                                            {pred.priority}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default Predictions;