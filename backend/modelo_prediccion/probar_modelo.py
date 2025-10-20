import joblib
import pandas as pd
from datetime import datetime

try:
    # Cargar el modelo entrenado
    ruta_modelo = "modelo_prediccion/modelos/modelo_demanda.pkl"
    modelo = joblib.load(ruta_modelo)
    print("Modelo cargado correctamente.")

    # Crear un DataFrame de prueba con las columnas que el modelo espera
    df_test = pd.DataFrame([{
        "producto_id": 1,
        "fecha_ordinal": pd.Timestamp("2025-10-14").toordinal()
    }])

    # Hacer predicción
    prediccion = modelo.predict(df_test)[0]
    print(f"Predicción de prueba: {prediccion:.2f}")

except Exception as e:
    print(f"Error al cargar el modelo o predecir: {e}")
