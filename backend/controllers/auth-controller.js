const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sql = require('mssql');

const MAX_INTENTOS = 5;          // Máximos intentos permitidos
const BLOQUEO_MINUTOS = 5;      // Bloqueo temporal en minutos

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Por favor ingresa usuario y contraseña' });
    }

    const pool = require('../config/db'); // <-- usar pool directamente

    const result = await pool.request()
      .input('email', sql.NVarChar, username)
      .query('SELECT * FROM inventario.usuarios WHERE email = @email');

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si está bloqueado
    const ahora = new Date();
    if (user.bloqueo_hasta && new Date(user.bloqueo_hasta) > ahora) {
      const minutosRestantes = Math.ceil((new Date(user.bloqueo_hasta) - ahora) / 60000);
      return res.status(403).json({
        message: `Cuenta bloqueada temporalmente. Intenta nuevamente en ${minutosRestantes} minutos.`
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      // Incrementar intentos fallidos
      let intentos = user.intentos_fallidos + 1;
      let bloqueo = null;

      if (intentos >= MAX_INTENTOS) {
        bloqueo = new Date(Date.now() + BLOQUEO_MINUTOS * 60000);
        intentos = 0; // resetear después de bloqueo
      }

      await pool.request()
        .input('usuario_id', sql.Int, user.usuario_id)
        .input('intentos_fallidos', sql.Int, intentos)
        .input('bloqueo_hasta', sql.DateTime, bloqueo)
        .query(`
                    UPDATE inventario.usuarios
                    SET intentos_fallidos = @intentos_fallidos,
                        bloqueo_hasta = @bloqueo_hasta
                    WHERE usuario_id = @usuario_id
                `);

      return res.status(401).json({
        message: 'Contraseña incorrecta',
        intentos_restantes: bloqueo ? 0 : MAX_INTENTOS - intentos
      });
    }

    // Resetear intentos fallidos si login es exitoso
    await pool.request()
      .input('usuario_id', sql.Int, user.usuario_id)
      .query(`
                UPDATE inventario.usuarios
                SET intentos_fallidos = 0, bloqueo_hasta = NULL
                WHERE usuario_id = @usuario_id
            `);

    // Generar token JWT
    const token = jwt.sign(
      { usuario_id: user.usuario_id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        usuario_id: user.usuario_id,
        nombre_completo: user.nombre_completo,
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login };