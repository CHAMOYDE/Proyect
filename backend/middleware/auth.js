const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No hay token, acceso denegado' });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token no válido' });
    }
};

// Middleware para verificar roles
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'No tienes permisos para esta acción' });
        }
        next();
    };
};

module.exports = { authMiddleware, checkRole };