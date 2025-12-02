const { validationResult } = require('express-validator');
const productService = require('../services/product.service');

const getAllProducts = async (req, res) => {
  try {
    const result = await productService.getAllProducts(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    res.json({ product });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(404).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await productService.createProduct(req.body);

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(400).json({ error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);

    res.json({
      message: 'Producto actualizado exitosamente',
      product
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(400).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);
    res.json(result);
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(404).json({ error: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const product = await productService.updateStock(id, stock);

    res.json({
      message: 'Stock actualizado exitosamente',
      product
    });
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(400).json({ error: error.message });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    const products = await productService.getLowStockProducts(threshold);
    res.json({ products });
  } catch (error) {
    console.error('Error al obtener productos con bajo stock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
};
