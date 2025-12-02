import express from 'express';
import { authenticate, isAdmin } from '../middlewares/auth.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

const router = express.Router();

// ========== GET endpoints para Admin ==========

// 1. Dashboard principal (solo admin)
router.get('/dashboard', authenticate, isAdmin, async (req, res) => {
  try {
    const [
      totalProducts,
      totalUsers,
      totalOrders,
      recentOrders
    ] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(10)
        .populate('user', 'name email')
        .populate('products.product', 'name price')
    ]);

    res.json({
      message: 'Dashboard de Administrador',
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        productsLowStock: await Product.countDocuments({ stock: { $lt: 10 } }),
        pendingOrders: await Order.countDocuments({ status: 'pending' })
      },
      recentOrders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET todos los usuarios (con paginación)
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments()
    ]);

    res.json({
      message: 'Lista de usuarios',
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET usuario por ID
router.get('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario encontrado',
      data: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. GET todos los productos (admin con más detalles)
router.get('/products', authenticate, isAdmin, async (req, res) => {
  try {
    const { category, minPrice, maxPrice, lowStock } = req.query;

    let filter = {};

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (lowStock === 'true') filter.stock = { $lt: 10 };

    const products = await Product.find(filter).sort({ createdAt: -1 });

    const stats = {
      total: products.length,
      lowStock: products.filter(p => p.stock < 10).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    };

    res.json({
      message: 'Productos con estadísticas',
      stats,
      data: products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. GET producto por ID (admin con más detalles)
router.get('/products/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Detalles completos del producto',
      data: product,
      analytics: {
        daysSinceCreation: Math.floor((new Date() - product.createdAt) / (1000 * 60 * 60 * 24)),
        needsRestock: product.stock < 10,
        value: product.price * product.stock
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. GET estadísticas detalladas
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const [
      newUsers,
      newProducts,
      totalSales,
      topProducts
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Product.countDocuments({ createdAt: { $gte: startDate } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Product.find().sort({ stock: 1 }).limit(5)
    ]);

    res.json({
      message: `Estadísticas del último ${period}`,
      period,
      dateRange: { start: startDate, end: now },
      stats: {
        newUsers,
        newProducts,
        totalSales: totalSales[0]?.total || 0,
        lowStockProducts: topProducts.length
      },
      topProductsNeedingRestock: topProducts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET logs de actividad (ejemplo básico)
router.get('/activity', authenticate, isAdmin, (req, res) => {
  // En un sistema real, esto vendría de una base de datos de logs
  const activities = [
    {
      id: 1,
      action: 'LOGIN',
      user: 'admin@example.com',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.1'
    },
    {
      id: 2,
      action: 'CREATE_PRODUCT',
      user: 'admin@example.com',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: 'Producto: Laptop Gamer'
    }
  ];

  res.json({
    message: 'Actividad reciente',
    data: activities
  });
});

// 8. GET configuración del sistema
router.get('/system-info', authenticate, isAdmin, (req, res) => {
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    apiVersion: '1.0.0'
  };

  res.json({
    message: 'Información del sistema',
    data: systemInfo
  });
});

export default router;
