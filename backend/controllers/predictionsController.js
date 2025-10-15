const { spawn } = require('child_process');
const { sales, products } = require('../data/mockData');

/**
 * Controlador principal: genera predicciones
 * Si se envía ?modo=ia → usa el modelo Python
 * Si no → usa datos simulados (mock)
 */
const getPredictions = async (req, res) => {
    try {
        const { productId, days, modo } = req.query;

        //  Si se elige "modo=ia", llama al modelo Python (versión 2)
        if (modo === 'ia') {
            if (!productId) {
                return res.status(400).json({ message: 'Debe especificar un productId' });
            }

            const { execFile } = require('child_process');
            const path = require('path');

            const scriptPath = path.join(__dirname, '../modelo_prediccion/predecir.py');

            // Ejecutar el script con argumento productId
            const python = execFile('python', [scriptPath, productId], (error, stdout, stderr) => {
                if (error) {
                    console.error('Error ejecutando modelo:', error);
                    return res.status(500).json({ message: 'Error ejecutando modelo de predicción' });
                }

                try {
                    const result = JSON.parse(stdout);
                    if (result.error) {
                        return res.status(400).json({ message: result.error });
                    }
                    res.json({
                        success: true,
                        source: 'IA real',
                        prediction: result
                    });
                } catch (err) {
                    console.error('Error procesando salida:', err);
                    res.status(500).json({
                        success: false,
                        message: 'Error al procesar salida del modelo IA',
                        error: err.message
                    });
                }
            });

            return;
        }


        // Si no se elige modo IA, usa la simulación (mock)
        if (productId) {
            const product = products.find(p => p.id === parseInt(productId));
            if (!product) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }

            const productSales = sales.filter(s => s.productId === parseInt(productId));
            const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
            const avgDailySales = productSales.length > 0 ? totalSold / 30 : 0;
            const daysToPredict = parseInt(days) || 30;
            const predictedDemand = Math.round(avgDailySales * daysToPredict);
            const daysUntilStockout = product.stock > 0 ? Math.round(product.stock / (avgDailySales || 1)) : 0;

            return res.json({
                success: true,
                source: 'Simulación (mock)',
                prediction: {
                    productId: product.id,
                    productName: product.name,
                    currentStock: product.stock,
                    avgDailySales: Math.round(avgDailySales * 100) / 100,
                    predictedDemand,
                    daysToPredict,
                    daysUntilStockout,
                    recommendedOrder: predictedDemand > product.stock ? predictedDemand - product.stock : 0,
                    alert: daysUntilStockout < 7 ? 'Stock crítico' : daysUntilStockout < 15 ? 'Considerar reabastecimiento' : 'Stock adecuado'
                }
            });
        }

        // Predicciones generales (mock)
        const predictions = products.map(product => {
            const productSales = sales.filter(s => s.productId === product.id);
            const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
            const avgDailySales = productSales.length > 0 ? totalSold / 30 : 0;
            const daysToPredict = parseInt(days) || 30;
            const predictedDemand = Math.round(avgDailySales * daysToPredict);
            const daysUntilStockout = product.stock > 0 ? Math.round(product.stock / (avgDailySales || 1)) : 0;

            return {
                productId: product.id,
                productName: product.name,
                currentStock: product.stock,
                avgDailySales: Math.round(avgDailySales * 100) / 100,
                predictedDemand,
                daysUntilStockout,
                recommendedOrder: predictedDemand > product.stock ? predictedDemand - product.stock : 0,
                priority: daysUntilStockout < 7 ? 'Alta' : daysUntilStockout < 15 ? 'Media' : 'Baja'
            };
        });

        predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

        res.json({
            success: true,
            source: 'Simulación (mock)',
            predictions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar predicciones' });
    }
};

/**
 *  Obtener tendencias generales
 */
const getTrends = (req, res) => {
    try {
        const productTrends = {};

        sales.forEach(sale => {
            if (!productTrends[sale.productId]) {
                productTrends[sale.productId] = {
                    productId: sale.productId,
                    productName: sale.productName,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    salesCount: 0
                };
            }
            productTrends[sale.productId].totalQuantity += sale.quantity;
            productTrends[sale.productId].totalRevenue += sale.totalPrice;
            productTrends[sale.productId].salesCount += 1;
        });

        const trends = Object.values(productTrends)
            .map(trend => ({
                ...trend,
                avgSaleSize: Math.round(trend.totalQuantity / trend.salesCount * 100) / 100,
                avgRevenue: Math.round(trend.totalRevenue / trend.salesCount * 100) / 100
            }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json({
            success: true,
            trends
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener tendencias' });
    }
};

module.exports = {
    getPredictions,
    getTrends
};
