const { sales, products } = require('../data/mockData');

// Simular predicciones de demanda (sin conectar Python aún)
const getPredictions = (req, res) => {
    try {
        const { productId, days } = req.query;

        // Si se solicita predicción para un producto específico
        if (productId) {
            const product = products.find(p => p.id === parseInt(productId));

            if (!product) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }

            // Calcular ventas históricas del producto
            const productSales = sales.filter(s => s.productId === parseInt(productId));
            const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
            const avgDailySales = productSales.length > 0 ? totalSold / 30 : 0;

            // Predicción simple (puedes reemplazar esto con el modelo de Python)
            const daysToPredict = parseInt(days) || 30;
            const predictedDemand = Math.round(avgDailySales * daysToPredict);
            const daysUntilStockout = product.stock > 0 ? Math.round(product.stock / (avgDailySales || 1)) : 0;

            return res.json({
                success: true,
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

        // Predicciones generales para todos los productos
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

        // Ordenar por prioridad
        predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

        res.json({
            success: true,
            predictions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar predicciones' });
    }
};

// Análisis de tendencias
const getTrends = (req, res) => {
    try {
        // Agrupar ventas por producto
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