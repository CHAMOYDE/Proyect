const { spawn } = require('child_process');
const path = require('path');
const { sql, connectDB, getPool } = require('../config/db');
const fs = require('fs');

const TIMEOUT = 30000; // 30 segundos

// Traer productos activos para el selector
const getActiveProducts = async (req, res) => {
    try {
        await connectDB();
        const pool = getPool();
        const result = await pool.request().query(`
            SELECT producto_id AS id, nombre AS name
            FROM inventario.productos
            WHERE activo = 1
            ORDER BY nombre ASC
        `);
        res.json({ success: true, products: result.recordset });
    } catch (err) {
        console.error("[PREDICTIONS] Error getActiveProducts:", err);
        res.status(500).json({ success: false, message: 'Error cargando productos', error: err.message });
    }
};

// Predicción de un producto específico
const predecirDemanda = async (req, res) => {
    const { productId, days = 30 } = req.body;
    if (!productId) {
        return res.status(400).json({ success: false, message: "Debe proporcionar un productId" });
    }

    try {
        await connectDB();
        const pool = getPool();
        
        // Obtener información del producto
        const result = await pool.request()
            .input('productId', sql.Int, productId)
            .query(`
                SELECT producto_id AS id, nombre AS productName, stock_actual AS currentStock
                FROM inventario.productos
                WHERE producto_id = @productId AND activo = 1
            `);

        const product = result.recordset[0];
        if (!product) {
            return res.status(404).json({ success: false, message: "Producto no encontrado" });
        }

        // Verificar si existe modelo entrenado
        const modelPath = path.join(__dirname, '..', 'models', 'saved_models', `model_${productId}.pkl`);
        
        if (!fs.existsSync(modelPath)) {
            // Sin modelo entrenado, calcular promedio básico de ventas
            const salesResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        ISNULL(AVG(CAST(cantidad AS FLOAT)), 0) AS avgDailySales,
                        ISNULL(SUM(cantidad), 0) AS totalSales
                    FROM inventario.ventas
                    WHERE producto_id = @productId 
                    AND fecha_venta >= DATEADD(day, -30, GETDATE())
                    AND activo = 1
                `);

            const avgDailySales = salesResult.recordset[0]?.avgDailySales || 0;
            const predictedDemand = Math.round(avgDailySales * days);
            const daysUntilStockout = avgDailySales > 0 ? Math.floor(product.currentStock / avgDailySales) : 999;
            const recommendedOrder = Math.max(0, Math.ceil(predictedDemand * 1.2 - product.currentStock));
            const { priority, alert } = calcularAlerta(daysUntilStockout);

            return res.json({
                success: true,
                prediction: [
                    {
                        ...product,
                        avgDailySales: Math.round(avgDailySales * 100) / 100,
                        predictedDemand,
                        daysUntilStockout,
                        recommendedOrder,
                        priority,
                        alert: 'Predicción básica (modelo no entrenado)'
                    }
                ]
            });
        }

        // Ejecutar modelo predictivo si existe
        try {
            const scriptPath = path.join(__dirname, '..', 'models', 'train_model.py');
            const output = await ejecutarPython(scriptPath, ['predict', productId.toString(), days.toString()]);
            const pred = JSON.parse(output);

            const avgDailySales = pred.promedio_diario || 0;
            const predictedDemand = pred.total_predicho || 0;
            const daysUntilStockout = avgDailySales > 0 ? Math.floor(product.currentStock / avgDailySales) : 999;
            const recommendedOrder = Math.max(0, Math.ceil(predictedDemand * 1.2 - product.currentStock));
            const { priority, alert } = calcularAlerta(daysUntilStockout);

            res.json({
                success: true,
                prediction: [
                    {
                        ...product,
                        avgDailySales: Math.round(avgDailySales * 100) / 100,
                        predictedDemand: Math.round(predictedDemand),
                        daysUntilStockout,
                        recommendedOrder,
                        priority,
                        alert
                    }
                ]
            });
        } catch (pythonError) {
            console.error("[PREDICTIONS] Error en Python:", pythonError);
            
            // Fallback a predicción básica
            const salesResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT 
                        ISNULL(AVG(CAST(cantidad AS FLOAT)), 0) AS avgDailySales,
                        ISNULL(SUM(cantidad), 0) AS totalSales
                    FROM inventario.ventas
                    WHERE producto_id = @productId 
                    AND fecha_venta >= DATEADD(day, -30, GETDATE())
                    AND activo = 1
                `);

            const avgDailySales = salesResult.recordset[0]?.avgDailySales || 0;
            const predictedDemand = Math.round(avgDailySales * days);
            const daysUntilStockout = avgDailySales > 0 ? Math.floor(product.currentStock / avgDailySales) : 999;
            const recommendedOrder = Math.max(0, Math.ceil(predictedDemand * 1.2 - product.currentStock));
            const { priority, alert } = calcularAlerta(daysUntilStockout);

            res.json({
                success: true,
                prediction: [
                    {
                        ...product,
                        avgDailySales: Math.round(avgDailySales * 100) / 100,
                        predictedDemand,
                        daysUntilStockout,
                        recommendedOrder,
                        priority,
                        alert: 'Predicción básica (error en modelo IA)'
                    }
                ]
            });
        }

    } catch (err) {
        console.error("[PREDICTIONS] Error predecirDemanda:", err);
        res.status(500).json({ success: false, message: "Error prediciendo demanda", error: err.message });
    }
};

// Traer predicciones de todos los productos
const getAllPredictions = async (req, res) => {
    try {
        await connectDB();
        const pool = getPool();
        
        // Obtener todos los productos activos
        const result = await pool.request().query(`
            SELECT producto_id AS productId, nombre AS productName, stock_actual AS currentStock
            FROM inventario.productos
            WHERE activo = 1
            ORDER BY nombre ASC
        `);

        const predictions = await Promise.all(result.recordset.map(async (product) => {
            try {
                // Calcular promedio de ventas de los últimos 30 días
                const salesResult = await pool.request()
                    .input('productId', sql.Int, product.productId)
                    .query(`
                        SELECT 
                            ISNULL(AVG(CAST(cantidad AS FLOAT)), 0) AS avgDailySales,
                            ISNULL(SUM(cantidad), 0) AS totalSales
                        FROM inventario.ventas
                        WHERE producto_id = @productId 
                        AND fecha_venta >= DATEADD(day, -30, GETDATE())
                        AND activo = 1
                    `);

                const avgDailySales = salesResult.recordset[0]?.avgDailySales || 0;
                const predictedDemand = Math.round(avgDailySales * 30);
                const daysUntilStockout = avgDailySales > 0 ? Math.floor(product.currentStock / avgDailySales) : 999;
                const recommendedOrder = Math.max(0, Math.ceil(predictedDemand * 1.2 - product.currentStock));
                const { priority, alert } = calcularAlerta(daysUntilStockout);

                return {
                    ...product,
                    avgDailySales: Math.round(avgDailySales * 100) / 100,
                    predictedDemand,
                    daysUntilStockout,
                    recommendedOrder,
                    priority,
                    alert
                };
            } catch (productError) {
                console.error(`[PREDICTIONS] Error producto ${product.productId}:`, productError);
                return {
                    ...product,
                    avgDailySales: 0,
                    predictedDemand: 0,
                    daysUntilStockout: 999,
                    recommendedOrder: 0,
                    priority: 'BAJA',
                    alert: 'Error calculando predicción'
                };
            }
        }));

        res.json({ success: true, predictions });
    } catch (err) {
        console.error("[PREDICTIONS] Error getAllPredictions:", err);
        res.status(500).json({ success: false, message: 'Error cargando predicciones', error: err.message });
    }
};

// Ejecutar Python
const ejecutarPython = (scriptPath, args = []) => {
    return new Promise((resolve, reject) => {
        const py = spawn('python', [scriptPath, ...args]);
        let dataOut = '';
        let dataErr = '';

        py.stdout.on('data', (data) => { dataOut += data.toString(); });
        py.stderr.on('data', (data) => { dataErr += data.toString(); });

        const timer = setTimeout(() => {
            py.kill();
            reject(new Error('Timeout: ejecución Python excedió 30 segundos'));
        }, TIMEOUT);

        py.on('close', (code) => {
            clearTimeout(timer);
            if (code !== 0) reject(new Error(dataErr || `Código de salida ${code}`));
            else resolve(dataOut);
        });
    });
};

// Calcular prioridad y alerta
const calcularAlerta = (daysUntilStockout) => {
    if (daysUntilStockout < 7) return { priority: 'CRITICA', alert: 'Stock crítico - Reabastecer urgente' };
    if (daysUntilStockout < 15) return { priority: 'ALTA', alert: 'Stock bajo - Planificar reabastecimiento' };
    if (daysUntilStockout < 30) return { priority: 'MEDIA', alert: 'Monitorear stock' };
    return { priority: 'BAJA', alert: 'Stock adecuado' };
};

module.exports = { getActiveProducts, predecirDemanda, getAllPredictions };