import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// GET todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET producto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST crear nuevo producto
router.post('/', async (req, res) => {
  try {
    console.log('📨 Datos recibidos:', req.body); // Para debug

    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      stock: req.body.stock,
      category: req.body.category,
      description: req.body.description
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('❌ Error al crear producto:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
