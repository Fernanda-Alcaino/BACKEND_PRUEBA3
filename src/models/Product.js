import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es requerido'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;
