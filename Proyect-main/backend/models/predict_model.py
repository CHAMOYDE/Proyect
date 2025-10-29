import sys
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def predecir(model_path, dias=30):
    # Cargar modelo entrenado
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    # Generar días futuros
    start = datetime.now()
    fechas = [start + timedelta(days=i) for i in range(1, dias + 1)]
    X_future = np.arange(len(fechas)).reshape(-1, 1)
    
    # Realizar predicción
    y_pred = model.predict(X_future)
    
    # Formatear resultado
    df_result = pd.DataFrame({
        "fecha": [d.strftime('%Y-%m-%d') for d in fechas],
        "prediccion": y_pred
    })
    return df_result.to_dict(orient="records")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python predecir.py <ruta_modelo> [dias]")
        sys.exit(1)

    model_path = sys.argv[1]
    dias = int(sys.argv[2]) if len(sys.argv) > 2 else 30

    resultados = predecir(model_path, dias)
    print(resultados)
