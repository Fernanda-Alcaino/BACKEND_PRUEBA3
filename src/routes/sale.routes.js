const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const saleValidation = require('../validations/sale.validation'); // Importar validaciones
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/role');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Ruta para crear nueva venta - SOLO CAJERO
router.post('/',
  checkRole('CAJERO'),
  saleValidation.createSaleValidation,
  saleValidation.validateSaleMiddleware, // Middleware personalizado
  saleController.createSale
);

// Ruta para obtener todas las ventas con validación de query params
router.get('/',
  saleValidation.getSalesValidation,
  saleController.getAllSales
);

// Ruta para obtener una venta específica por ID
router.get('/:id',
  saleValidation.getSaleByIdValidation,
  saleController.getSaleById
);

// Ruta para obtener reporte de ventas
router.get('/report/sales',
  checkRole('ADMIN'),
  saleValidation.getSalesReportValidation,
  saleController.getSalesReport
);

// Ruta para obtener ventas del día actual
router.get('/today/sales',
  saleController.getTodaySales
);

// Ruta para cancelar una venta
router.patch('/:id/cancel',
  checkRole('ADMIN'), // Solo admin puede cancelar ventas
  saleValidation.cancelSaleValidation,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Reutilizar la función de cancelación del controller
      req.body = { reason }; // Añadir razón al body si existe
      await saleController.cancelSale(req, res);
    } catch (error) {
      console.error('Error en ruta de cancelación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Ruta para obtener resumen diario
router.get('/summary/daily',
  checkRole('ADMIN'), // Solo admin puede ver resumen diario
  saleValidation.getDailySummaryValidation,
  async (req, res) => {
    try {
      const { date, cashierId } = req.query;
      const saleService = require('../services/sale.service');

      const summary = await saleService.getDailySummary(date, cashierId);
      res.json(summary);
    } catch (error) {
      console.error('Error al obtener resumen diario:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Ruta para obtener ventas por cajero
router.get('/cashier/:cashierId',
  checkRole('ADMIN'), // Solo admin puede ver ventas por cajero
  saleValidation.getSalesValidation,
  saleController.getSalesByCashier
);

// Ruta para obtener ventas por rango de fechas
router.get('/date-range/:startDate/:endDate',
  checkRole('ADMIN'), // Solo admin
  async (req, res) => {
    try {
      const { startDate, endDate } = req.params;

      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Fechas inválidas' });
      }

      if (end < start) {
        return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
      }

      req.query.startDate = startDate;
      req.query.endDate = endDate;

      await saleController.getAllSales(req, res);
    } catch (error) {
      console.error('Error en ruta de rango de fechas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Ruta para obtener productos más vendidos
router.get('/top-products',
  checkRole('ADMIN'), // Solo admin
  async (req, res) => {
    try {
      const { limit = 10, startDate, endDate } = req.query;

      const { SaleDetail, Product } = require('../models');
      const { Op } = require('sequelize');

      const where = {};

      if (startDate || endDate) {
        where['$sale.saleDate$'] = {};
        if (startDate) where['$sale.saleDate$'][Op.gte] = new Date(startDate);
        if (endDate) where['$sale.saleDate$'][Op.lte] = new Date(endDate);
      }

      const topProducts = await SaleDetail.findAll({
        where,
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalSales']
        ],
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'code']
        }],
        group: ['productId'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: parseInt(limit)
      });

      res.json({ topProducts });
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Ruta para obtener estadísticas de ventas
router.get('/statistics/overview',
  checkRole('ADMIN'), // Solo admin
  saleValidation.getSalesReportValidation,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const saleService = require('../services/sale.service');

      const report = await saleService.getSalesReport(
        { startDate, endDate },
        'ADMIN',
        req.user.id
      );

      // Calcular estadísticas adicionales
      const totalProductsSold = report.sales.reduce((total, sale) => {
        return total + sale.details.reduce((sum, detail) => sum + detail.quantity, 0);
      }, 0);

      const averageProductsPerSale = report.statistics.totalSales > 0
        ? totalProductsSold / report.statistics.totalSales
        : 0;

      res.json({
        ...report,
        additionalStats: {
          totalProductsSold,
          averageProductsPerSale: parseFloat(averageProductsPerSale.toFixed(2)),
          averageTicket: parseFloat(report.statistics.averageSale.toFixed(2))
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Ruta para exportar ventas a CSV/Excel
router.get('/export/csv',
  checkRole('ADMIN'), // Solo admin
  saleValidation.getSalesValidation,
  async (req, res) => {
    try {
      const result = await saleController.getAllSales(req, res);

      // Convertir a formato CSV
      const sales = result.sales;
      let csv = 'ID,Fecha,Factura,Total,Método Pago,Cajero\n';

      sales.forEach(sale => {
        csv += `${sale.id},${sale.saleDate},${sale.invoiceNumber},${sale.totalAmount},${sale.paymentMethod},${sale.cashier?.username || 'N/A'}\n`;
      });

      res.header('Content-Type', 'text/csv');
      res.attachment(`ventas_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      res.status(500).json({ error: 'Error al exportar datos' });
    }
  }
);

module.exports = router;
