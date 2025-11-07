"use client"

// Tabla genérica reutilizable
import { useState } from "react"
import "../styles/Table.css"

function Table({ columns, data, onEdit, onDelete, loading = false }) {
  const [sortConfig, setSortConfig] = useState(null)

  // Función para ordenar
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  // Datos ordenados
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  if (loading) {
    return <div className="table-loading">Cargando...</div>
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => handleSort(col.key)} className="sortable">
                {col.label}
                {sortConfig?.key === col.key && <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>}
              </th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
              <td className="actions">
                {onEdit && (
                  <button className="btn-edit" onClick={() => onEdit(row)}>
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button className="btn-delete" onClick={() => onDelete(row.id)}>
                    🗑️
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
