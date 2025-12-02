// src/routes/auth.routes.js - VERSIÓN CORREGIDA
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidation = require('../validations/auth.validation');
const verifyToken = require('../middleware/auth');

// Login - PÚBLICO (todos pueden loguearse)
router.post('/login', authValidation.loginValidation, authController.login);

// Registrar nuevo usuario - TEMPORALMENTE PÚBLICO (para crear primer admin)
// Después de crear el admin, cambia a: verifyToken, authValidation.registerValidation, authController.register
router.post('/register', authValidation.registerValidation, authController.register);

// Obtener perfil del usuario actual - PROTEGIDO (requiere token)
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
