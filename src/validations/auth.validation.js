// src/validations/auth.validation.js
const { body } = require('express-validator');

const loginValidation = [
  body('username')
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .trim(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const registerValidation = [
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

module.exports = {
  loginValidation,
  registerValidation
};
