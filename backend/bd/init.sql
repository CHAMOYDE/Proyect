CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'empleado',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,                -- Código único comercial
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 5,               -- Stock mínimo antes de alertar
    fecha_vencimiento DATE,                -- Fecha de expiración opcional
    proveedor VARCHAR(100),                -- Proveedor del producto
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha_venta DATE DEFAULT CURRENT_DATE
);

--para ia
CREATE TABLE IF NOT EXISTS historial_demanda (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    cantidad_vendida INT NOT NULL,
    registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_historial_producto_fecha
ON historial_demanda (producto_id, fecha);
