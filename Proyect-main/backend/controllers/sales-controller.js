let { sales, products } = require('../config/db');

// Obtener todas las ventas
const getSales = (req, res) => {
    try {
        res.json({
            success: true,
            sales
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener ventas' });
    }
};

// Obtener una venta por ID
const getSaleById = (req, res) => {
    try {
        const sale = sales.find(s => s.id === parseInt(req.params.id));

        if (!sale) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        res.json({
            success: true,
            sale
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la venta' });
    }
};

// Registrar una nueva venta
const createSale = (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        // Buscar el producto
        const productIndex = products.findIndex(p => p.id === parseInt(productId));

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const product = products[productIndex];

        // Verificar stock disponible
        if (product.stock < quantity) {
            return res.status(400).json({
                message: 'Stock insuficiente',
                available: product.stock,
                requested: quantity
            });
        }

        // Calcular precio total
        const totalPrice = product.price * quantity;

        // Generar nuevo ID para la venta
        const newId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;

        // Crear la venta
        const newSale = {
            id: newId,
            productId: product.id,
            productName: product.name,
            quantity: parseInt(quantity),
            totalPrice,
            date: new Date().toISOString().split('T')[0],
            seller: req.user.name
        };

        // Reducir el stock del producto
        products[productIndex].stock -= quantity;

        // Agregar la venta
        sales.push(newSale);

        res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            sale: newSale,
            productStock: products[productIndex].stock
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar la venta' });
    }
};

// Obtener reporte de ventas
const getSalesReport = (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let filteredSales = sales;

        // Filtrar por fechas si se proporcionan
        if (startDate) {
            filteredSales = filteredSales.filter(s => s.date >= startDate);
        }
        if (endDate) {
            filteredSales = filteredSales.filter(s => s.date <= endDate);
        }

        // Calcular estadísticas
        const totalSales = filteredSales.length;
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
        const totalQuantity = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

        // Productos más vendidos
        const productSales = {};
        filteredSales.forEach(sale => {
            if (!productSales[sale.productName]) {
                productSales[sale.productName] = {
                    name: sale.productName,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[sale.productName].quantity += sale.quantity;
            productSales[sale.productName].revenue += sale.totalPrice;
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        res.json({
            success: true,
            report: {
                totalSales,
                totalRevenue,
                totalQuantity,
                topProducts,
                sales: filteredSales
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al generar el reporte' });
    }
};

module.exports = {
    getSales,
    getSaleById,
    createSale,
    getSalesReport
};