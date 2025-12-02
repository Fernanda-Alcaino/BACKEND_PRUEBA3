const { validationResult } = require('express-validator');
const userService = require('../services/user.service');

const getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id, req.user.role, req.user.id);
    res.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(error.message.includes('permisos') ? 403 : 404).json({
      error: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await userService.createUser(req.body);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(400).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user = await userService.updateUser(
      id,
      req.body,
      req.user.role,
      req.user.id
    );

    res.json({
      message: 'Usuario actualizado exitosamente',
      user
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(error.message.includes('permisos') ? 403 : 400).json({
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser(id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(400).json({ error: error.message });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.toggleUserActive(id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    res.status(400).json({ error: error.message });
  }
};

const getUserSalesStats = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.getUserSalesStats(id, req.query);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUserSales = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.getUserSales(
      id,
      req.query,
      req.user.role,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('Error al obtener ventas del usuario:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({
      error: error.message
    });
  }
};

const getActiveCashiers = async (req, res) => {
  try {
    const cashiers = await userService.getActiveCashiers();
    res.json({ cashiers });
  } catch (error) {
    console.error('Error al obtener cajeros activos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({ error: 'Término de búsqueda requerido' });
    }

    const users = await userService.searchUsers(search);
    res.json({ users });
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUserSalesStats,
  getUserSales,
  getActiveCashiers,
  searchUsers
};
