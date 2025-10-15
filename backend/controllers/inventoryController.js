let { products } = require('../data/mockData');

// Obtener todos los productos
const getProducts = (req, res) => {
    try {
        res.json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};

// Obtener un producto por ID
const getProductById = (req, res) => {
    try {
        const product = products.find(p => p.id === parseInt(req.params.id));

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto' });
    }
};

// Crear un nuevo producto
const createProduct = (req, res) => {
    try {
        const { name, sku, category, stock, minStock, price, expiryDate, supplier } = req.body;

        // Validación básica
        if (!name || !sku || !category || stock === undefined || !price) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        // Generar nuevo ID
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

        const newProduct = {
            id: newId,
            name,
            sku,
            category,
            stock: parseInt(stock),
            minStock: parseInt(minStock) || 0,
            price: parseFloat(price),
            expiryDate: expiryDate || null,
            supplier: supplier || ''
        };

        products.push(newProduct);

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            product: newProduct
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el producto' });
    }
};

// Actualizar un producto
const updateProduct = (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const { name, sku, category, stock, minStock, price, expiryDate, supplier } = req.body;

        products[productIndex] = {
            ...products[productIndex],
            name: name || products[productIndex].name,
            sku: sku || products[productIndex].sku,
            category: category || products[productIndex].category,
            stock: stock !== undefined ? parseInt(stock) : products[productIndex].stock,
            minStock: minStock !== undefined ? parseInt(minStock) : products[productIndex].minStock,
            price: price !== undefined ? parseFloat(price) : products[productIndex].price,
            expiryDate: expiryDate !== undefined ? expiryDate : products[productIndex].expiryDate,
            supplier: supplier !== undefined ? supplier : products[productIndex].supplier
        };

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            product: products[productIndex]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

// Eliminar un producto
const deleteProduct = (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        products.splice(productIndex, 1);

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
};

// Obtener alertas (productos con bajo stock o próximos a vencer)
const getAlerts = (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const lowStockProducts = products.filter(p => p.stock < p.minStock);

        const expiringProducts = products.filter(p => {
            if (!p.expiryDate) return false;
            const expiryDate = new Date(p.expiryDate);
            return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
        });

        res.json({
            success: true,
            alerts: {
                lowStock: lowStockProducts,
                expiringSoon: expiringProducts
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las alertas' });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAlerts
};