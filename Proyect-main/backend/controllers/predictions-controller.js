const { spawn } = require('child_process');
const path = require('path');

const predecirDemanda = (req, res) => {
  const { productId, days } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Falta el ID del producto." });
  }

  const modelPath = path.join(__dirname, `../models/saved_models/model_${productId}.pkl`);
  const pythonProcess = spawn('python', [
    path.join(__dirname, '../models/predecir.py'),
    modelPath,
    days || '30'
  ]);

  let data = '';
  let error = '';

  pythonProcess.stdout.on('data', chunk => data += chunk.toString());
  pythonProcess.stderr.on('data', chunk => error += chunk.toString());

  pythonProcess.on('close', code => {
    if (code !== 0 || error) {
      return res.status(500).json({ message: 'Error en la predicción', error });
    }
    try {
      const predictions = JSON.parse(data);
      res.json({ productId, predictions });
    } catch (err) {
      res.status(500).json({ message: 'Error procesando resultado', error: err.message });
    }
  });
};

module.exports = { predecirDemanda };
