const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const productValidation = require('../validations/product.validation');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/role');

router.use(verifyToken);

// Obtener todos los productos
router.get('/', productController.getAllProducts);

// Obtener productos con bajo stock
router.get('/low-stock', productController.getLowStockProducts);

// Obtener producto por ID
router.get('/:id', productController.getProductById);

// Obtener producto por código
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const product = await require('../services/product.service').getProductByCode(code);
    res.json({ product });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Rutas solo para ADMIN
router.post('/',
  checkRole('ADMIN'),
  productValidation.createProductValidation,
  productController.createProduct
);

router.put('/:id',
  checkRole('ADMIN'),
  productValidation.updateProductValidation,
  productController.updateProduct
);

router.delete('/:id',
  checkRole('ADMIN'),
  productController.deleteProduct
);

// Actualizar stock
router.patch('/:id/stock',
  checkRole('ADMIN'),
  productController.updateStock
);

module.exports = router;
