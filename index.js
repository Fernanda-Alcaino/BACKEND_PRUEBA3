// ESTO QUEDA IGUAL, NO LO CAMBIES
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '¡API funcionando!' });
});

// Ruta GET productos (TU CÓDIGO ACTUAL)
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Producto 1', price: 100 },
    { id: 2, name: 'Producto 2', price: 200 }
  ]);
});

// Ruta POST productos (TU CÓDIGO ACTUAL)
app.post('/api/products', (req, res) => {
  console.log('📨 Datos recibidos:', req.body);
  res.status(201).json({
    message: 'Producto creado',
    data: req.body,
    id: Date.now()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
});
