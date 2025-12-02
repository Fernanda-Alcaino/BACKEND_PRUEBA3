const { Sale, SaleDetail, Product, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

class SaleService {
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FAC-${year}${month}${day}-${random}`;
  }

  async createSale(saleData, cashierId) {
    const { items, paymentMethod = 'EFECTIVO' } = saleData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('La venta debe contener al menos un producto');
    }

    // Validar items y calcular total
    let totalAmount = 0;
    const productUpdates = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);

      if (!product) {
        throw new Error(`Producto con ID ${item.productId} no encontrado`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para: ${product.name}. Disponible: ${product.stock}`);
      }

      if (item.quantity <= 0) {
        throw new Error(`Cantidad inválida para: ${product.name}`);
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      productUpdates.push({
        product,
        quantity: item.quantity
      });
    }

    const transaction = await Sale.sequelize.transaction();

    try {
      // Crear venta
      const sale = await Sale.create({
        invoiceNumber: this.generateInvoiceNumber(),
        saleDate: new Date(),
        totalAmount,
        paymentMethod,
        status: 'COMPLETADA',
        cashierId
      }, { transaction });

      // Crear detalles y actualizar stock
      for (const { product, quantity } of productUpdates) {
        const subtotal = product.price * quantity;

        await SaleDetail.create({
          saleId: sale.id,
          productId: product.id,
          quantity,
          unitPrice: product.price,
          subtotal
        }, { transaction });

        await product.update({
          stock: product.stock - quantity
        }, { transaction });
      }

      await transaction.commit();

      // Obtener venta completa
      const saleWithDetails = await Sale.findByPk(sale.id, {
        include: [
          {
            model: SaleDetail,
            as: 'details',
            include: [{
              model: Product,
              as: 'product'
            }]
          },
          {
            model: User,
            as: 'cashier',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      return saleWithDetails;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllSales({ page = 1, limit = 10, startDate, endDate, cashierId }, userRole, userId) {
    const offset = (page - 1) * limit;

    const where = {};

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate[Op.gte] = new Date(startDate);
      if (endDate) where.saleDate[Op.lte] = new Date(endDate);
    }

    if (cashierId) {
      where.cashierId = cashierId;
    }

    if (userRole === 'CAJERO') {
      where.cashierId = userId;
    }

    const { count, rows: sales } = await Sale.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['saleDate', 'DESC']],
      include: [
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'username']
        }
      ]
    });

    return {
      sales,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    };
  }

  async getSaleById(id, userRole, userId) {
    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: SaleDetail,
          as: 'details',
          include: [{
            model: Product,
            as: 'product'
          }]
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    if (userRole === 'CAJERO' && sale.cashierId !== userId) {
      throw new Error('No tienes permisos para ver esta venta');
    }

    return sale;
  }

  async cancelSale(id, userRole, userId) {
    const sale = await Sale.findByPk(id, {
      include: [{
        model: SaleDetail,
        as: 'details',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    if (userRole === 'CAJERO' && sale.cashierId !== userId) {
      throw new Error('No tienes permisos para cancelar esta venta');
    }

    if (sale.status === 'CANCELADA') {
      throw new Error('La venta ya está cancelada');
    }

    const transaction = await sale.sequelize.transaction();

    try {
      // Revertir stock
      for (const detail of sale.details) {
        const product = detail.product;
        await product.update({
          stock: product.stock + detail.quantity
        }, { transaction });
      }

      await sale.update({ status: 'CANCELADA' }, { transaction });

      await transaction.commit();

      return sale;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getSalesReport({ startDate, endDate }, userRole, userId) {
    if (!startDate || !endDate) {
      throw new Error('Se requieren fechas de inicio y fin');
    }

    const where = {
      saleDate: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      },
      status: 'COMPLETADA'
    };

    if (userRole === 'CAJERO') {
      where.cashierId = userId;
    }

    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: SaleDetail,
          as: 'details',
          include: [{
            model: Product,
            as: 'product'
          }]
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['username']
        }
      ],
      order: [['saleDate', 'ASC']]
    });

    // Calcular estadísticas
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const averageSale = totalSales > 0 ? totalAmount / totalSales : 0;

    // Estadísticas por producto
    const productStats = {};
    sales.forEach(sale => {
      sale.details.forEach(detail => {
        const productName = detail.product.name;
        if (!productStats[productName]) {
          productStats[productName] = {
            quantity: 0,
            total: 0
          };
        }
        productStats[productName].quantity += detail.quantity;
        productStats[productName].total += detail.subtotal;
      });
    });

    return {
      period: { startDate, endDate },
      statistics: {
        totalSales,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        averageSale: parseFloat(averageSale.toFixed(2))
      },
      productStats,
      sales: sales.slice(0, 50) // Limitar a 50 ventas para el reporte
    };
  }

  async getTodaySales(userRole, userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      saleDate: {
        [Op.between]: [today, tomorrow]
      }
    };

    if (userRole === 'CAJERO') {
      where.cashierId = userId;
    }

    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: User,
          as: 'cashier',
          attributes: ['username']
        }
      ],
      order: [['saleDate', 'DESC']]
    });

    const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);

    return {
      date: today.toISOString().split('T')[0],
      totalSales: sales.length,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      sales
    };
  }

  async getSalesByCashier(cashierId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const { count, rows: sales } = await Sale.findAndCountAll({
      where: { cashierId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['saleDate', 'DESC']],
      include: [
        {
          model: User,
          as: 'cashier',
          attributes: ['username']
        }
      ]
    });

    return {
      sales,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    };
  }

  async getDailySummary(date = null, cashierId = null) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where = {
      saleDate: {
        [Op.between]: [targetDate, nextDay]
      },
      status: 'COMPLETADA'
    };

    if (cashierId) {
      where.cashierId = cashierId;
    }

    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: SaleDetail,
          as: 'details',
          include: [{
            model: Product,
            as: 'product'
          }]
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'username']
        }
      ],
      order: [['saleDate', 'ASC']]
    });

    // Calcular estadísticas
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);

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

    // Productos vendidos
    const productsSold = sales.reduce((products, sale) => {
      sale.details.forEach(detail => {
        const productName = detail.product.name;
        if (!products[productName]) {
          products[productName] = {
            quantity: 0,
            total: 0,
            product: detail.product
          };
        }
        products[productName].quantity += detail.quantity;
        products[productName].total += detail.subtotal;
      });
      return products;
    }, {});

    // Convertir a array y ordenar por cantidad
    const topProducts = Object.entries(productsSold)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      date: targetDate.toISOString().split('T')[0],
      summary: {
        totalSales,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        averageSale: totalSales > 0 ? parseFloat((totalAmount / totalSales).toFixed(2)) : 0,
        paymentMethods: paymentStats
      },
      topProducts,
      sales: sales.map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        cashier: sale.cashier.username,
        itemsCount: sale.details.length
      }))
    };
  }

  async getTopProducts(limit = 10, startDate = null, endDate = null) {
    const where = {
      '$sale.saleDate$': {},
      '$sale.status$': 'COMPLETADA'
    };

    if (startDate || endDate) {
      if (startDate) where['$sale.saleDate$'][Op.gte] = new Date(startDate);
      if (endDate) where['$sale.saleDate$'][Op.lte] = new Date(endDate);
    }

    const topProducts = await SaleDetail.findAll({
      where,
      attributes: [
        'productId',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'totalSales']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'code']
      }, {
        model: Sale,
        as: 'sale',
        attributes: []
      }],
      group: ['productId'],
      order: [[Sequelize.fn('SUM', Sequelize.col('quantity')), 'DESC']],
      limit: parseInt(limit)
    });

    return topProducts;
  }

  async getSalesStatistics(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new Error('Se requieren fechas de inicio y fin');
    }

    const where = {
      saleDate: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      },
      status: 'COMPLETADA'
    };

    const sales = await Sale.findAll({
      where,
      include: [{
        model: SaleDetail,
        as: 'details',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);

    const totalProductsSold = sales.reduce((total, sale) => {
      return total + sale.details.reduce((sum, detail) => sum + detail.quantity, 0);
    }, 0);

    const averageProductsPerSale = totalSales > 0
      ? totalProductsSold / totalSales
      : 0;

    // Estadísticas por día
    const salesByDay = {};
    sales.forEach(sale => {
      const date = sale.saleDate.toISOString().split('T')[0];
      if (!salesByDay[date]) {
        salesByDay[date] = {
          count: 0,
          total: 0,
          products: 0
        };
      }
      salesByDay[date].count += 1;
      salesByDay[date].total += parseFloat(sale.totalAmount);
      salesByDay[date].products += sale.details.reduce((sum, detail) => sum + detail.quantity, 0);
    });

    return {
      period: { startDate, endDate },
      statistics: {
        totalSales,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        averageSale: totalSales > 0 ? parseFloat((totalAmount / totalSales).toFixed(2)) : 0,
        totalProductsSold,
        averageProductsPerSale: parseFloat(averageProductsPerSale.toFixed(2))
      },
      salesByDay: Object.entries(salesByDay).map(([date, data]) => ({ date, ...data })),
      sales: sales.slice(0, 20) // Últimas 20 ventas
    };
  }
}

module.exports = new SaleService();
