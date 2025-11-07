import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [remaining, setRemaining] = useState(5);
    const [isBlocked, setIsBlocked] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (timeLeft > 0) {
            setIsBlocked(true);
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsBlocked(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isBlocked) return;

        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            setAttempts(0);
            setRemaining(5);
            setTimeLeft(0);
            setIsBlocked(false);
            navigate('/dashboard');
        } else {
            const data = result.data || {};
            if (result.status === 429) {
                const blockTime = data.timeLeft || 300;
                setTimeLeft(blockTime);
                setAttempts(data.attempts || 5);
                setError(`Cuenta bloqueada. Espera ${blockTime} segundos.`);
            } else if (result.status === 401) {
                const newAttempts = data.attempts || (attempts + 1);
                const newRemaining = 5 - newAttempts;
                setAttempts(newAttempts);
                setRemaining(newRemaining);

                if (newRemaining <= 0) {
                    setTimeLeft(300);
                    setError('5 intentos fallidos! Bloqueado por 5 minutos. Contacta al admin.');
                } else if (newRemaining === 1) {
                    setError(`Ultimo intento! Si fallas, se bloqueara por 5 minutos.`);
                } else {
                    setError(`Credenciales incorrectas. Te quedan ${newRemaining} intentos.`);
                }
            } else {
                setError(result.message || 'Error del servidor');
            }
        }

        setLoading(false);
    };

    const resetAttempts = () => {
        if (!isBlocked) {
            setAttempts(0);
            setRemaining(5);
            setError('');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container-modern">
                <div className="login-brand">
                    <div className="brand-content">
                        <h1>D & R</h1>
                        <p>Sistema de Inventario y Gestion de Ventas con IA</p>
                        <div className="brand-decoration">
                            <div className="circle"></div>
                            <div className="circle"></div>
                            <div className="circle"></div>
                        </div>
                    </div>
                </div>

                <div className="login-form">
                    <div className="form-box">
                        <h2>Iniciar Sesion</h2>
                        <p className="subtitle">Accede a tu panel de control</p>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="email">Usuario</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Ingrese su email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        resetAttempts();
                                    }}
                                    required
                                    disabled={loading || isBlocked}
                                    autoComplete="email"
                                    spellCheck="false"
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Contraseña</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Ingrese su contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading || isBlocked}
                                    autoComplete="current-password"
                                    spellCheck="false"
                                />
                            </div>

                            {error && <div className="error-alert">{error}</div>}

                            {isBlocked && (
                                <div className="blocked-alert">
                                    Espera <strong id="countdown">{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</strong> segundos.
                                </div>
                            )}

                            {attempts > 0 && remaining > 0 && !isBlocked && (
                                <div className="attempts-info">
                                    Intentos restantes: <strong>{remaining}/5</strong>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || isBlocked}
                                className={`login-btn ${isBlocked ? 'disabled' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span> Iniciando...
                                    </>
                                ) : (
                                    'Iniciar Sesion'
                                )}
                            </button>
                        </form>

                        <div className="login-footer">
                            <p><strong>Usuario:</strong> admin@dyr.com</p>
                            <p><strong>Contraseña:</strong> Admin123!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
