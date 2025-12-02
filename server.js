import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import productRoutes from './routes/product.routes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // ¡ESTO ES CRUCIAL!
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/products', productRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Conexión a MongoDB
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tienda';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error conectando a MongoDB:', error);
  });

export default app;
