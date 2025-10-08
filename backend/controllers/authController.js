const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { users } = require('../data/mockData');

// Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar que vengan los datos
        if (!username || !password) {
            return res.status(400).json({ message: 'Por favor ingresa usuario y contraseña' });
        }

        // Buscar el usuario
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Verificar la contraseña
        const isMatch = password === user.password;

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Crear el token JWT
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Enviar respuesta
        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = { login };