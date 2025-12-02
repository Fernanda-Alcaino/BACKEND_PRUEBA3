import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// RUTAS DE ADMIN (NO AFECTAN TU SERVIDOR PRINCIPAL)
app.get('/admin/dashboard', (req, res) => {
  res.json({
    message: 'Panel de Administrador',
    stats: {
      totalProducts: 150,
      totalUsers: 45,
      revenue: 12500
    }
  });
});

app.get('/admin/users', (req, res) => {
  res.json({
    message: 'Lista de usuarios',
    data: [
      { id: 1, name: 'Usuario 1', email: 'user1@example.com' },
      { id: 2, name: 'Usuario 2', email: 'user2@example.com' }
    ]
  });
});

const PORT_ADMIN = 3001;
app.listen(PORT_ADMIN, () => {
  console.log(`👑 Servidor Admin en: http://localhost:${PORT_ADMIN}`);
});
