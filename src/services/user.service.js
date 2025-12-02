const { User, Sale } = require('../models');
const { Op } = require('sequelize');

class UserService {
  async getAllUsers({ page = 1, limit = 10, role, search = '' }) {
    const offset = (page - 1) * limit;

    const where = {};

    if (role && ['ADMIN', 'CAJERO'].includes(role)) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password'] },
      order: [['username', 'ASC']]
    });

    return {
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    };
  }

  async getUserById(id, requesterRole, requesterId) {
    if (requesterRole === 'CAJERO' && parseInt(id) !== requesterId) {
      throw new Error('No tienes permisos para ver este usuario');
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Sale,
        as: 'sales',
        limit: 5,
        order: [['saleDate', 'DESC']]
      }]
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  async createUser(userData) {
    const { username, email, password, role = 'CAJERO' } = userData;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      throw new Error('El nombre de usuario o email ya está registrado');
    }

    const user = await User.create({
      username,
      email,
      password,
      role
    });

    // Excluir contraseña en la respuesta
    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
  }

  async updateUser(id, updateData, requesterRole, requesterId) {
    if (requesterRole === 'CAJERO' && parseInt(id) !== requesterId) {
      throw new Error('Solo puedes actualizar tu propio perfil');
    }

    // Cajeros no pueden cambiar su rol
    if (requesterRole === 'CAJERO' && updateData.role) {
      delete updateData.role;
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar email único
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email: updateData.email }
      });
      if (existingEmail) {
        throw new Error('El email ya está en uso');
      }
    }

    // Verificar username único
    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await User.findOne({
        where: { username: updateData.username }
      });
      if (existingUsername) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }

    // No permitir actualizar contraseña desde esta función
    if (updateData.password) {
      delete updateData.password;
    }

    await user.update(updateData);

    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
  }

  async deleteUser(id, requesterId) {
    if (parseInt(id) === requesterId) {
      throw new Error('No puedes eliminar tu propia cuenta');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await user.update({ isActive: false });

    return { message: 'Usuario desactivado exitosamente' };
  }

  async toggleUserActive(id, requesterId) {
    if (parseInt(id) === requesterId) {
      throw new Error('No puedes cambiar el estado de tu propia cuenta');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await user.update({ isActive: !user.isActive });

    return {
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} exitosamente`,
      user: {
        id: user.id,
        username: user.username,
        isActive: user.isActive
      }
    };
  }

  async getUserSalesStats(userId, { startDate, endDate }) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role']
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const where = {
      cashierId: userId,
      status: 'COMPLETADA'
    };

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate[Op.gte] = new Date(startDate);
      if (endDate) where.saleDate[Op.lte] = new Date(endDate);
    }

    const sales = await Sale.findAll({
      where,
      attributes: ['id', 'saleDate', 'totalAmount', 'paymentMethod']
    });

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const averageSale = totalSales > 0 ? totalAmount / totalSales : 0;

    // Estadísticas por método de pago
    const paymentStats = sales.reduce((stats, sale) => {
      const method = sale.paymentMethod;
      if (!stats[method]) {
        stats[method] = { count: 0, total: 0 };
      }
      stats[method].count += 1;
      stats[method].total += parseFloat(sale.totalAmount);
      return stats;
    }, {});

    return {
      user,
      period: { startDate, endDate },
      statistics: {
        totalSales,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        averageSale: parseFloat(averageSale.toFixed(2)),
        paymentMethods: paymentStats
      },
      recentSales: sales.slice(0, 10)
    };
  }

  async getUserSales(userId, { page = 1, limit = 10 }, requesterRole, requesterId) {
    if (requesterRole === 'CAJERO' && parseInt(userId) !== requesterId) {
      throw new Error('Solo puedes ver tus propias ventas');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const offset = (page - 1) * limit;
    const where = { cashierId: userId };

    const { count, rows: sales } = await Sale.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['saleDate', 'DESC']]
    });

    return {
      user: {
        id: user.id,
        username: user.username
      },
      sales,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    };
  }

  async getUserByUsername(username) {
    const user = await User.findOne({
      where: { username },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  async getActiveCashiers() {
    const cashiers = await User.findAll({
      where: {
        role: 'CAJERO',
        isActive: true
      },
      attributes: ['id', 'username', 'email'],
      order: [['username', 'ASC']]
    });

    return cashiers;
  }

  async searchUsers(searchTerm) {
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${searchTerm}%` } },
          { email: { [Op.like]: `%${searchTerm}%` } }
        ],
        isActive: true
      },
      attributes: { exclude: ['password'] },
      limit: 20,
      order: [['username', 'ASC']]
    });

    return users;
  }
}

module.exports = new UserService();
