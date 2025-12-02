import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '¡API funcionando!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Ruta GET de ejemplo
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Producto 1', price: 100 },
    { id: 2, name: 'Producto 2', price: 200 }
  ]);
});

// Ruta POST de ejemplo
app.post('/api/products', (req, res) => {
  console.log('📨 Datos recibidos:', req.body);
  res.status(201).json({
    message: 'Producto creado',
    data: req.body,
    id: Date.now()
  });
});

// Manejo de errores
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📁 Directorio: ${process.cwd()}`);
});
