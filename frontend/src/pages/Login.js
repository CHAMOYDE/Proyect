import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="login-wrapper">
            {/* Fondo con partículas */}
            <div className="particles">
                {[...Array(50)].map((_, i) => (
                    <span key={i} style={{ '--i': i }}></span>
                ))}
            </div>

            {/* Contenedor principal */}
            <div className="login-container-modern">
                {/* Lado izquierdo: Branding */}
                <div className="login-brand">
                    <div className="brand-content">
                        <h1>D & R</h1>
                        <p>Sistema de Inventario y Gestion de ventas</p>
                        <div className="brand-decoration">
                            <div className="circle"></div>
                            <div className="circle"></div>
                            <div className="circle"></div>
                        </div>
                    </div>
                </div>

                {/* Lado derecho: Formulario */}
                <div className="login-form">
                    <div className="form-box">
                        <h2>Iniciar Sesión</h2>
                        <p className="subtitle">Accede a tu panel de control</p>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Usuario</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <span className="input-icon">User</span>
                            </div>

                            <div className="input-group">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span className="input-icon">Lock</span>
                            </div>

                            {error && <div className="error-alert">{error}</div>}

                            <button type="submit" disabled={loading} className="login-btn">
                                {loading ? (
                                    <>
                                        <span className="spinner"></span> Iniciando...
                                    </>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </form>

                        <div className="login-footer">
                            <p><strong>Usuario:</strong> admin</p>
                            <p><strong>Contraseña:</strong> admin123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;