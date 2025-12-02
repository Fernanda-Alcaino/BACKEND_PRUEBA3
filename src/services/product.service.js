const { Product } = require('../models');
const { Op } = require('sequelize');

class ProductService {
  async getAllProducts({ page = 1, limit = 10, search = '', category }) {
    const offset = (page - 1) * limit;

    const where = {
      isActive: true
    };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category) {
      where.category = category;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    return {
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    };
  }

  async getProductById(id) {
    const product = await Product.findOne({
      where: { id, isActive: true }
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return product;
  }

  async createProduct(productData) {
    const { code, name, description, price, stock, category } = productData;

    // Verificar si el código ya existe
    const existingProduct = await Product.findOne({ where: { code } });
    if (existingProduct) {
      throw new Error('El código del producto ya existe');
    }

    const product = await Product.create({
      code,
      name,
      description,
      price,
      stock: stock || 0,
      category
    });

    return product;
  }

  async updateProduct(id, updateData) {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Si se actualiza el código, verificar que no exista
    if (updateData.code && updateData.code !== product.code) {
      const existingCode = await Product.findOne({
        where: { code: updateData.code }
      });
      if (existingCode) {
        throw new Error('El código ya está en uso por otro producto');
      }
    }

    await product.update(updateData);

    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    await product.update({ isActive: false });

    return { message: 'Producto eliminado exitosamente' };
  }

  async updateStock(id, stock) {
    if (stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    const product = await Product.findByPk(id);

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    await product.update({ stock });

    return product;
  }

  async getLowStockProducts(threshold = 10) {
    const products = await Product.findAll({
      where: {
        stock: { [Op.lte]: threshold },
        isActive: true
      },
      order: [['stock', 'ASC']]
    });

    return products;
  }

  async getProductByCode(code) {
    const product = await Product.findOne({
      where: { code, isActive: true }
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return product;
  }
}

module.exports = new ProductService();
