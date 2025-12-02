const { body, param } = require('express-validator');

const createUserValidation = [
  body('username')
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .trim()
    .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'CAJERO']).withMessage('Rol inválido')
];

const updateUserValidation = [
  param('id')
    .isInt().withMessage('ID inválido'),
  body('email')
    .optional()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'CAJERO']).withMessage('Rol inválido')
];

const changePasswordValidation = [
  param('id')
    .isInt().withMessage('ID inválido'),
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  changePasswordValidation
};
