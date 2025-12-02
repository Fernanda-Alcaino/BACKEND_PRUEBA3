// src/controllers/auth.controller.js - VERSIÓN CORREGIDA
const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const login = async (req, res) => {
  try {
    // Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Validación básica
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const result = await authService.login(username, password);

    res.json({
      message: 'Login exitoso',
      ...result
    });
  } catch (error) {
    console.error('Error en controller login:', error);
    res.status(401).json({ error: error.message });
  }
};

const register = async (req, res) => {
  try {
    // Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    // Validación básica
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const result = await authService.register(req.body);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      ...result
    });
  } catch (error) {
    console.error('Error en controller register:', error);
    res.status(400).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ user });
  } catch (error) {
    console.error('Error en controller getProfile:', error);
    res.status(404).json({ error: error.message });
  }
};

module.exports = {
  login,
  register,
  getProfile
};
