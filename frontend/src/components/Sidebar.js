"use client"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/Sidebar.css"

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()

    const menuItems = [
        { path: "/dashboard", label: "Dashboard", icon: "fa-home" },
        { path: "/inventory", label: "Inventario", icon: "fa-boxes" },
        { path: "/sales", label: "Ventas", icon: "fa-shopping-cart" },
        { path: "/predictions", label: "Predicciones", icon: "fa-chart-line" },
        { path: "/purchases", label: "Lista de Compras", icon: "fa-list" },
    ]

    return (
        <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <h2 className="logo">D&R</h2>
                <button onClick={toggleSidebar} className="toggle-btn">
                    {isCollapsed ? "→" : "←"}
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        className={`nav-btn ${location.pathname === item.path ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                        data-title={item.label}
                    >
                        <i className={`fas ${item.icon}`}></i>
                        <span className="nav-text">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="nav-btn logout-btn" data-title="Cerrar Sesión">
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="nav-text">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    )
}

export default Sidebar
