// Usuarios mock (ya con contraseñas hasheadas para bcrypt)
const users = [
    {
        id: 1,
        username: 'admin',
        password: 'admin123', // Sin hashear por ahora
        role: 'admin',
        name: 'Administrador'
    },
    {
        id: 2,
        username: 'vendedor',
        password: 'vendedor123',
        role: 'vendedor',
        name: 'Vendedor 1'
    }
];

// Productos mock
let products = [
    {
        id: 1,
        name: 'Laptop HP',
        sku: 'LAP-001',
        category: 'Electrónica',
        stock: 5,
        minStock: 10,
        price: 2500,
        expiryDate: '2025-12-31',
        supplier: 'HP Inc.'
    },
    {
        id: 2,
        name: 'Mouse Logitech',
        sku: 'MOU-001',
        category: 'Accesorios',
        stock: 50,
        minStock: 20,
        price: 25,
        expiryDate: null,
        supplier: 'Logitech'
    },
    {
        id: 3,
        name: 'Teclado Mecánico',
        sku: 'TEC-001',
        category: 'Accesorios',
        stock: 3,
        minStock: 15,
        price: 80,
        expiryDate: null,
        supplier: 'Razer'
    },
    {
        id: 4,
        name: 'Monitor LG 24"',
        sku: 'MON-001',
        category: 'Electrónica',
        stock: 8,
        minStock: 5,
        price: 350,
        expiryDate: '2025-11-15',
        supplier: 'LG Electronics'
    }
];

// Ventas mock
let sales = [
    {
        id: 1,
        productId: 1,
        productName: 'Laptop HP',
        quantity: 2,
        totalPrice: 5000,
        date: '2025-10-01',
        seller: 'Vendedor 1'
    },
    {
        id: 2,
        productId: 2,
        productName: 'Mouse Logitech',
        quantity: 10,
        totalPrice: 250,
        date: '2025-10-02',
        seller: 'Vendedor 1'
    },
    {
        id: 3,
        productId: 4,
        productName: 'Monitor LG 24"',
        quantity: 1,
        totalPrice: 350,
        date: '2025-10-03',
        seller: 'Admin'
    }
];

module.exports = {
    users,
    products,
    sales
};