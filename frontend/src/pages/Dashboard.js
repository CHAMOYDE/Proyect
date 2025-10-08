import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { inventoryService, salesService, predictionsService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStockCount: 0,
        expiringCount: 0,
        totalSales: 0
    });
    const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [productsRes, alertsRes, salesRes] = await Promise.all([
                inventoryService.getProducts(),
                inventoryService.getAlerts(),
                salesService.getSales()
            ]);

            setStats({
                totalProducts: productsRes.data.products.length,
                lowStockCount: alertsRes.data.alerts.lowStock.length,
                expiringCount: alertsRes.data.alerts.expiringSoon.length,
                totalSales: salesRes.data.sales.length
            });

            setAlerts(alertsRes.data.alerts);
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

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="dashboard">
            <nav className="navbar">
                <h1>Sistema de Inventario</h1>
                <div className="nav-links">
                    <button onClick={() => navigate('/dashboard')}>Dashboard</button>
                    <button onClick={() => navigate('/inventory')}>Inventario</button>
                    <button onClick={() => navigate('/sales')}>Ventas</button>
                    <button onClick={() => navigate('/predictions')}>Predicciones</button>
                </div>
                <div className="user-info">
                    <span>Bienvenido, {user?.name}</span>
                    <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <h2>Dashboard</h2>

                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Productos</h3>
                        <p className="stat-number">{stats.totalProducts}</p>
                    </div>
                    <div className="stat-card alert">
                        <h3>Bajo Stock</h3>
                        <p className="stat-number">{stats.lowStockCount}</p>
                    </div>
                    <div className="stat-card warning">
                        <h3>Por Vencer</h3>
                        <p className="stat-number">{stats.expiringCount}</p>
                    </div>
                    <div className="stat-card success">
                        <h3>Ventas Totales</h3>
                        <p className="stat-number">{stats.totalSales}</p>
                    </div>
                </div>

                <div className="alerts-section">
                    {alerts.lowStock.length > 0 && (
                        <div className="alert-box alert">
                            <h3>⚠️ Productos con Bajo Stock</h3>
                            <ul>
                                {alerts.lowStock.map(product => (
                                    <li key={product.id}>
                                        <strong>{product.name}</strong> - Stock: {product.stock} (Mínimo: {product.minStock})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {alerts.expiringSoon.length > 0 && (
                        <div className="alert-box warning">
                            <h3>📅 Productos Próximos a Vencer</h3>
                            <ul>
                                {alerts.expiringSoon.map(product => (
                                    <li key={product.id}>
                                        <strong>{product.name}</strong> - Vence: {product.expiryDate}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {alerts.lowStock.length === 0 && alerts.expiringSoon.length === 0 && (
                        <div className="alert-box success">
                            <h3>✅ Todo en orden</h3>
                            <p>No hay alertas pendientes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;