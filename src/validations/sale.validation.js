const { body, param, query } = require('express-validator');

const createSaleValidation = [
  body('items')
    .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto en la venta')
    .custom((items) => {
      for (const item of items) {
        if (!item.productId || !item.quantity) {
          throw new Error('Cada item debe tener productId y quantity');
        }
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error('La cantidad debe ser un número entero mayor a 0');
        }
      }
      return true;
    }),

  body('paymentMethod')
    .optional()
    .isIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']).withMessage('Método de pago inválido'),

  body('customerName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre del cliente no puede exceder 100 caracteres'),

  body('customerDocument')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El documento del cliente no puede exceder 20 caracteres'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const updateSaleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de venta inválido'),

  body('status')
    .optional()
    .isIn(['PENDIENTE', 'COMPLETADA', 'CANCELADA']).withMessage('Estado de venta inválido'),

  body('paymentMethod')
    .optional()
    .isIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']).withMessage('Método de pago inválido'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
];

const cancelSaleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de venta inválido'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La razón de cancelación no puede exceder 200 caracteres')
];

const getSalesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor a 0')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
    .toInt(),

  query('startDate')
    .optional()
    .isISO8601().withMessage('Fecha de inicio inválida (formato YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),

  query('endDate')
    .optional()
    .isISO8601().withMessage('Fecha de fin inválida (formato YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .custom((endDate, { req }) => {
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const end = new Date(endDate);
        return end >= startDate;
      }
      return true;
    }).withMessage('La fecha de fin debe ser posterior o igual a la fecha de inicio'),

  query('cashierId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de cajero inválido')
    .toInt(),

  query('status')
    .optional()
    .isIn(['PENDIENTE', 'COMPLETADA', 'CANCELADA']).withMessage('Estado de venta inválido'),

  query('paymentMethod')
    .optional()
    .isIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']).withMessage('Método de pago inválido'),

  query('minAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('El monto mínimo debe ser un número positivo'),

  query('maxAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('El monto máximo debe ser un número positivo')
    .custom((maxAmount, { req }) => {
      if (req.query.minAmount && maxAmount) {
        return parseFloat(maxAmount) >= parseFloat(req.query.minAmount);
      }
      return true;
    }).withMessage('El monto máximo debe ser mayor o igual al monto mínimo')
];

const getSaleByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de venta inválido')
];

const getSalesReportValidation = [
  query('startDate')
    .notEmpty().withMessage('Fecha de inicio requerida')
    .isISO8601().withMessage('Fecha de inicio inválida (formato YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),

  query('endDate')
    .notEmpty().withMessage('Fecha de fin requerida')
    .isISO8601().withMessage('Fecha de fin inválida (formato YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .custom((endDate, { req }) => {
      const startDate = new Date(req.query.startDate);
      const end = new Date(endDate);
      return end >= startDate;
    }).withMessage('La fecha de fin debe ser posterior o igual a la fecha de inicio'),

  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'product', 'category', 'cashier']).withMessage('Agrupación inválida'),

  query('cashierId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de cajero inválido')
    .toInt(),

  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La categoría no puede exceder 50 caracteres')
];

const addItemToSaleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de venta inválido'),

  body('productId')
    .isInt({ min: 1 }).withMessage('ID de producto inválido'),

  body('quantity')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero mayor a 0')
];

const updateItemQuantityValidation = [
  param('saleId')
    .isInt({ min: 1 }).withMessage('ID de venta inválido'),

  param('itemId')
    .isInt({ min: 1 }).withMessage('ID de item inválido'),

  body('quantity')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero mayor a 0')
];

const refundItemValidation = [
  param('saleId')
    .isInt({ min: 1 }).withMessage('ID de venta inválido'),

  param('itemId')
    .isInt({ min: 1 }).withMessage('ID de item inválido'),

  body('quantity')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero mayor a 0'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La razón de devolución no puede exceder 200 caracteres')
];

const getDailySummaryValidation = [
  query('date')
    .optional()
    .isISO8601().withMessage('Fecha inválida (formato YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),

  query('cashierId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de cajero inválido')
    .toInt()
];

const validateSaleItems = async (items, { req }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('La venta debe contener al menos un producto');
  }

  const { Product } = require('../models');
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.productId) {
      errors.push(`Item ${i + 1}: productId es requerido`);
      continue;
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${i + 1}: quantity debe ser mayor a 0`);
      continue;
    }

    if (!Number.isInteger(item.quantity)) {
      errors.push(`Item ${i + 1}: quantity debe ser un número entero`);
      continue;
    }

    // Verificar existencia del producto
    const product = await Product.findByPk(item.productId);
    if (!product) {
      errors.push(`Item ${i + 1}: Producto con ID ${item.productId} no encontrado`);
      continue;
    }

    // Verificar stock
    if (product.stock < item.quantity) {
      errors.push(`Item ${i + 1}: Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
    }

    // Verificar si el producto está activo
    if (!product.isActive) {
      errors.push(`Item ${i + 1}: Producto ${product.name} no está disponible`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  return true;
};

// Middleware de validación personalizado
const validateSaleMiddleware = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La venta debe contener al menos un producto' });
    }

    const { Product } = require('../models');
    let totalAmount = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({
          error: 'Cada item debe tener productId y quantity'
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          error: 'La cantidad debe ser un número entero mayor a 0'
        });
      }

      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(404).json({
          error: `Producto con ID ${item.productId} no encontrado`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          error: `Producto ${product.name} no está disponible`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
        });
      }

      // Calcular subtotal
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
    }

    // Agregar totalAmount a req.body para que esté disponible en el controller
    req.body.calculatedTotal = totalAmount;

    next();
  } catch (error) {
    console.error('Error en validación de venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  createSaleValidation,
  updateSaleValidation,
  cancelSaleValidation,
  getSalesValidation,
  getSaleByIdValidation,
  getSalesReportValidation,
  getDailySummaryValidation,
  addItemToSaleValidation,
  updateItemQuantityValidation,
  refundItemValidation,
  validateSaleItems,
  validateSaleMiddleware
};
