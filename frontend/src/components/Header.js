"use client"

import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import "../styles/Header.css"

function Header() {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className={`header ${isDark ? "dark" : "light"}`}>
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

        {/* Botón de tema */}
        <button className="theme-toggle" onClick={toggleTheme} title={isDark ? "Modo claro" : "Modo oscuro"}>
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  )
}

export default Header
