const { validationResult } = require('express-validator');
const saleService = require('../services/sale.service');

const createSale = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sale = await saleService.createSale(req.body, req.user.id);

    res.status(201).json({
      message: 'Venta registrada exitosamente',
      sale
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(400).json({ error: error.message });
  }
};

const getAllSales = async (req, res) => {
  try {
    const result = await saleService.getAllSales(
      req.query,
      req.user.role,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await saleService.getSaleById(id, req.user.role, req.user.id);
    res.json({ sale });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(error.message.includes('permisos') ? 403 : 404).json({
      error: error.message
    });
  }
};

const cancelSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await saleService.cancelSale(id, req.user.role, req.user.id);

    res.json({
      message: 'Venta cancelada exitosamente',
      sale
    });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    res.status(400).json({ error: error.message });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const result = await saleService.getSalesReport(
      req.query,
      req.user.role,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(400).json({ error: error.message });
  }
};

const getTodaySales = async (req, res) => {
  try {
    const result = await saleService.getTodaySales(req.user.role, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getSalesByCashier = async (req, res) => {
  try {
    const { cashierId } = req.params;
    const result = await saleService.getSalesByCashier(cashierId, req.query);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener ventas por cajero:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  createSale,
  getAllSales,
  getSaleById,
  cancelSale,
  getSalesReport,
  getTodaySales,
  getSalesByCashier
};
