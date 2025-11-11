IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'inventario')
    EXEC('CREATE SCHEMA inventario');

-- Tabla usuarios
CREATE TABLE inventario.usuarios (
    usuario_id INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    rol NVARCHAR(20) CHECK (rol IN ('administrador','empleado')) NOT NULL,
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    ultimo_acceso DATETIME,
    intentos_fallidos INT DEFAULT 0,
    bloqueo_hasta DATETIME NULL
);

-- Tabla productos
CREATE TABLE inventario.productos (
    producto_id INT IDENTITY(1,1) PRIMARY KEY,
    codigo_sku NVARCHAR(50) UNIQUE NOT NULL,
    nombre NVARCHAR(200) NOT NULL,
    categoria NVARCHAR(50) CHECK (categoria IN ('laptop','periferico','accesorio','consumible')) NOT NULL,
    marca NVARCHAR(50),
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2) NOT NULL,
    stock_actual INT DEFAULT 0,
    stock_minimo INT DEFAULT 1,
    stock_maximo INT DEFAULT 100,
    proveedor NVARCHAR(100),
    fecha_ultimo_restock DATETIME DEFAULT GETDATE(),
    activo BIT DEFAULT 1
);

CREATE INDEX idx_categoria ON inventario.productos(categoria);
CREATE INDEX idx_sku ON inventario.productos(codigo_sku);

-- Tabla ventas
CREATE TABLE inventario.ventas (
    venta_id INT IDENTITY(1,1) PRIMARY KEY,
    producto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(5,2) DEFAULT 0 CHECK (descuento >= 0 AND descuento <= 100),
    total DECIMAL(10,2) NOT NULL,
    metodo_pago NVARCHAR(30),
    fecha_venta DATETIME DEFAULT GETDATE(),
    es_temporada_alta BIT DEFAULT 0,
    activo BIT DEFAULT 1,
    CONSTRAINT FK_ventas_productos FOREIGN KEY (producto_id) REFERENCES inventario.productos(producto_id),
    CONSTRAINT FK_ventas_usuarios FOREIGN KEY (usuario_id) REFERENCES inventario.usuarios(usuario_id)
);

CREATE INDEX idx_fecha_venta ON inventario.ventas(fecha_venta);
CREATE INDEX idx_producto_fecha ON inventario.ventas(producto_id, fecha_venta);

-- Tabla historial_demanda
CREATE TABLE inventario.historial_demanda (
    historial_id INT IDENTITY(1,1) PRIMARY KEY,
    producto_id INT NOT NULL,
    fecha DATE NOT NULL,
    cantidad_vendida INT NOT NULL,
    total_ventas DECIMAL(10,2),
    registrado_en DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_historial_producto FOREIGN KEY (producto_id) REFERENCES inventario.productos(producto_id)
);

CREATE INDEX idx_producto_fecha_historial ON inventario.historial_demanda(producto_id, fecha);

-- Tabla predicciones
CREATE TABLE inventario.predicciones (
    prediccion_id INT IDENTITY(1,1) PRIMARY KEY,
    producto_id INT NOT NULL,
    fecha_prediccion DATETIME DEFAULT GETDATE(),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    cantidad_predicha DECIMAL(10,2) NOT NULL,
    intervalo_confianza_inf DECIMAL(10,2),
    intervalo_confianza_sup DECIMAL(10,2),
    cantidad_real INT NULL,
    error_absoluto DECIMAL(10,2) NULL,
    mape DECIMAL(7,4) NULL,
    estado NVARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','validada','requiere_reentrenamiento')),
    CONSTRAINT FK_predicciones_producto FOREIGN KEY (producto_id) REFERENCES inventario.productos(producto_id)
);

-- Tabla metricas_modelo
CREATE TABLE inventario.metricas_modelo (
    metrica_id INT IDENTITY(1,1) PRIMARY KEY,
    fecha_calculo DATETIME DEFAULT GETDATE(),
    mape DECIMAL(7,4),
    rmse DECIMAL(10,4),
    r2_score DECIMAL(7,4),
    mae DECIMAL(10,4),
    total_predicciones INT,
    productos_analizados INT,
    estado NVARCHAR(20) CHECK (estado IN ('optimo','aceptable','requiere_reentrenamiento')),
    observaciones NVARCHAR(500)
);

-- Tabla audit_logs
CREATE TABLE inventario.audit_logs (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NULL,
    accion NVARCHAR(100) NOT NULL,
    entidad NVARCHAR(50) NOT NULL,
    entidad_id INT NULL,
    fecha DATETIME DEFAULT GETDATE(),
    descripcion NVARCHAR(400),
    ip_address NVARCHAR(45),
    CONSTRAINT FK_audit_usuario FOREIGN KEY (usuario_id) REFERENCES inventario.usuarios(usuario_id)
);
