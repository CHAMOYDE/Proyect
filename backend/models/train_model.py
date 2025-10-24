import os
import pandas as pd
import joblib
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

# Parámetros de conexión
driver = "ODBC+Driver+18+for+SQL+Server"  # Formato compatible con sqlalchemy/pyodbc
server = os.getenv("DB_SERVER")
database = os.getenv("DB_NAME")
username = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")

connection_string = (
    f"mssql+pyodbc://{username}:{password}@{server}/{database}"
    f"?driver={driver}&Encrypt=yes&TrustServerCertificate=no"
)


# Cadena de conexión para Azure SQL
connection_string = (
    f"mssql+pyodbc://{username}:{password}@{server}/{database}"
    f"?driver={driver.replace(' ', '+')}&Encrypt=yes&TrustServerCertificate=no"
)

# Crear conexión con SQLAlchemy
engine = create_engine(connection_string)

# Cargar los datos históricos desde Azure SQL
def load_data():
    print("Cargando datos desde Azure SQL...")
    query = """
        SELECT 
            h.producto_id,
            p.nombre AS producto_nombre,
            h.fecha,
            h.cantidad_vendida
        FROM historial_demanda h
        JOIN productos p ON h.producto_id = p.id
        ORDER BY h.producto_id, h.fecha;
    """
    df = pd.read_sql(query, engine)
    print(f"{len(df)} registros cargados.")
    return df


# Entrenar modelo de predicción simple (base)
def train_model(df):
    print("Entrenando modelo predictivo...")

    # Agrupar datos por producto y fecha
    df_grouped = (
        df.groupby(['producto_id', 'fecha'])['cantidad_vendida']
        .sum()
        .reset_index()
    )

    # Crear variable de tiempo
    df_grouped['fecha_ordinal'] = df_grouped['fecha'].map(datetime.toordinal)

    # Entrenar un modelo por producto
    models = {}

    for producto_id, data in df_grouped.groupby('producto_id'):
        if len(data) < 5:
            print(f"Producto {producto_id} tiene pocos datos, omitido.")
            continue

        X = data[['fecha_ordinal']]
        y = data['cantidad_vendida']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

        model = LinearRegression()
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)

        models[producto_id] = model
        print(f"Producto {producto_id} entrenado. MSE: {mse:.2f}")

    return models


#  Guardar los modelos entrenados
def save_models(models):
    os.makedirs("models/saved_models", exist_ok=True)
    for producto_id, model in models.items():
        path = f"models/saved_models/model_{producto_id}.pkl"
        joblib.dump(model, path)
        print(f"Modelo guardado: {path}")


# Ejecución principal

def main():
    try:
        df = load_data()
        models = train_model(df)
        save_models(models)
        print("Entrenamiento completado correctamente.")
    except Exception as e:
        print("Error durante el entrenamiento:", e)


if __name__ == "__main__":
    main()
