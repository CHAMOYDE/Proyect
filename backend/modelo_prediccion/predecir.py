import sys
import json
import joblib
import pandas as pd
from datetime import datetime, timedelta

def cargar_modelo(ruta_modelo):
    try:
        modelo = joblib.load(ruta_modelo)
        print(f"Modelo cargado correctamente desde {ruta_modelo}")
        return modelo
    except Exception as e:
        print(json.dumps({"error": f"No se pudo cargar el modelo: {e}"}))
        sys.exit(1)

try:
    # Ruta del modelo
    ruta_modelo = "backend/modelo_prediccion/modelos/modelo_demanda.pkl"
    modelo = cargar_modelo(ruta_modelo)

    # Leer datos de entrada
    data = sys.stdin.read().strip()
    if not data:
        print(json.dumps({"error": "No se recibieron datos desde Node.js"}))
        sys.exit(0)

    input_data = json.loads(data)
    df = pd.DataFrame([input_data])

    # ---------- Preprocesamiento ----------
    if 'fecha' in df.columns:
        df['fecha_ordinal'] = pd.to_datetime(df['fecha']).map(pd.Timestamp.toordinal)
    else:
        print(json.dumps({"error": "No se recibió la columna 'fecha'"}))
        sys.exit(1)

    if 'producto_id' not in df.columns:
        print(json.dumps({"error": "No se recibió la columna 'producto_id'"}))
        sys.exit(1)

    X_pred = df[['producto_id', 'fecha_ordinal']]

    # Predicción
    prediccion = modelo.predict(X_pred)[0]
    # Evitar valores negativos
    prediccion = max(0, prediccion)

    # Rango de confianza ±10%
    limite_inferior = max(0, prediccion * 0.9)
    limite_superior = prediccion * 1.1

    resultado = {
        "demanda_predicha": float(prediccion),
        "limite_inferior": float(limite_inferior),
        "limite_superior": float(limite_superior),
        "fecha_objetivo": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    }

    print(json.dumps(resultado))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
