const { body, param } = require('express-validator');

const createProductValidation = [
  body('code')
    .notEmpty().withMessage('El código del producto es requerido')
    .trim(),
  body('name')
    .notEmpty().withMessage('El nombre del producto es requerido')
    .trim(),
  body('price')
    .notEmpty().withMessage('El precio es requerido')
    .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock no puede ser negativo')
];

const updateProductValidation = [
  param('id')
    .isInt().withMessage('ID inválido'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock no puede ser negativo')
];

module.exports = {
  createProductValidation,
  updateProductValidation
};
