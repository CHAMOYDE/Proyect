import os
import psycopg2
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
from dotenv import load_dotenv

# Cargar variables de entorno (.env)
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Conexión a PostgreSQL
conn = psycopg2.connect(DATABASE_URL)
print("Conectado a la base de datos correctamente")

# Crear historial_demanda si no existe
with conn.cursor() as cur:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS historial_demanda (
            id SERIAL PRIMARY KEY,
            producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
            fecha DATE NOT NULL,
            cantidad_vendida INT NOT NULL,
            registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()

# Cargar datos desde la tabla de ventas
query = """
    SELECT 
        v.producto_id,
        v.fecha_venta AS fecha,
        v.cantidad AS cantidad_vendida
    FROM ventas v
    WHERE v.cantidad > 0
    ORDER BY v.fecha_venta ASC;
"""
df = pd.read_sql(query, conn)
print("Datos cargados desde la base de datos:")
print(df.head())

# Si no hay datos, salir
if df.empty:
    print("No hay datos suficientes en 'ventas' para entrenar el modelo.")
    conn.close()
    exit()

# Preparar los datos
df['fecha_ordinal'] = pd.to_datetime(df['fecha']).map(pd.Timestamp.toordinal)
X = df[['producto_id', 'fecha_ordinal']]  # Ahora incluye producto_id
y = df['cantidad_vendida']

# Dividir en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Entrenar modelo
modelo = LinearRegression()
modelo.fit(X_train, y_train)

# Evaluar modelo
y_pred = modelo.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print(f"Error medio absoluto del modelo: {mae:.2f}")

# Guardar modelo entrenado
ruta_modelo = os.path.join("modelo_prediccion", "modelos", "modelo_demanda.pkl")
os.makedirs(os.path.dirname(ruta_modelo), exist_ok=True)
joblib.dump(modelo, ruta_modelo)
print(f"Modelo guardado en: {ruta_modelo}")

# Cerrar conexión
conn.close()
print("Entrenamiento completado y conexión cerrada correctamente.")
