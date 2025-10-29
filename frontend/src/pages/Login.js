import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [remaining, setRemaining] = useState(5);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Temporizador para el bloqueo
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            // === CONTROL DE INTENTOS DESDE BACKEND ===
            const data = result.data || {};

            if (result.status === 429) {
                // Bloqueado
                setTimeLeft(data.timeLeft || 15);
                setAttempts(data.attempts || 5);
                setError(`Cuenta bloqueada. Espera ${data.timeLeft} segundos.`);
            } else if (result.status === 401) {
                // Intento fallido
                const newAttempts = data.attempts || (attempts + 1);
                const newRemaining = data.remaining || (5 - newAttempts);

                setAttempts(newAttempts);
                setRemaining(newRemaining);

                if (data.nextBlockTime) {
                    setError(
                        `¡Último intento! Si fallas, se bloqueará por ${data.nextBlockTime} segundos.`
                    );
                } else {
                    setError(`Credenciales incorrectas. Te quedan ${newRemaining} intentos.`);
                }
            } else {
                setError(result.message || 'Error del servidor');
            }
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
                        <p>Sistema de Inventario y Gestión de Ventas</p>
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
                                    disabled={loading || timeLeft > 0}
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
                                    disabled={loading || timeLeft > 0}
                                />
                                <span className="input-icon">Lock</span>
                            </div>

                            {/* Mensajes de error y bloqueo */}
                            {error && <div className="error-alert">{error}</div>}

                            {timeLeft > 0 && (
                                <div className="blocked-alert">
                                    Espera <strong>{timeLeft}</strong> segundos para intentar de nuevo.
                                </div>
                            )}

                            {attempts > 0 && remaining > 0 && timeLeft === 0 && (
                                <div className="attempts-info">
                                    Intentos fallidos: <strong>{attempts}</strong> / 5
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || timeLeft > 0}
                                className="login-btn"
                            >
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