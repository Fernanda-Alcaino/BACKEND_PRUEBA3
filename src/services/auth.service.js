// src/services/auth.service.js - VERSIÓN CORREGIDA Y FUNCIONAL
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async login(username, password) {
    try {
      // Buscar usuario
      const user = await User.findOne({ where: { username } });

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar si está activo
      if (!user.isActive) {
        throw new Error('Usuario desactivado');
      }

      // Verificar contraseña
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }

      // Generar token
      const token = generateToken(user);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Error en servicio login:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const { username, email, password, role = 'CAJERO' } = userData;

      // Verificar si el usuario ya existe - FORMA SIMPLIFICADA
      const existingUser = await User.findOne({
        where: { username }
      });

      if (existingUser) {
        throw new Error('El nombre de usuario ya está registrado');
      }

      // Verificar si el email ya existe
      const existingEmail = await User.findOne({
        where: { email }
      });

      if (existingEmail) {
        throw new Error('El email ya está registrado');
      }

      // Crear usuario
      const user = await User.create({
        username,
        email,
        password,
        role
      });

      // Generar token
      const token = generateToken(user);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Error en servicio register:', error);
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      console.error('Error en servicio getProfile:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
