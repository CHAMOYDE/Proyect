"use client"

import "../styles/ConfirmModal.css"

function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDangerous = false,
}) {
    if (!isOpen) return null

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-message">{message}</p>
                <div className="confirm-modal-actions">
                    <button onClick={onCancel} className="confirm-btn-cancel">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className={`confirm-btn-submit ${isDangerous ? "dangerous" : ""}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal
