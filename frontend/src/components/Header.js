"use client"

import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import "../styles/Header.css"

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="header">
      <div className="header-content">
        {/* Información de usuario */}
        <div className="user-section">
          <img src={user?.avatar || "/placeholder-user.jpg"} alt="Avatar" className="avatar" />
          <div className="user-details">
            <div className="title-with-icon">
              <img src="/as.png" alt="Icon" className="title-icon" />
              <h3>{user?.name || "Usuario"}</h3>
            </div>
            <p>{user?.role || "Sin rol"}</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="logout-container">
            <div className="logout-info">
              <span className="logout-text">Cerrar sesión</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
