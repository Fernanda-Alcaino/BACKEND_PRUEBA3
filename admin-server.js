// admin-server.js - SERVIDOR SEPARADO para admin
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// ========== RUTAS DE ADMIN ==========
app.get('/admin', (req, res) => {
  res.json({
    message: '🔧 Panel de Administración',
    status: 'Funcionando',
    endpoints: [
      'GET /admin/dashboard',
      'GET /admin/users',
      'GET /admin/products',
      'GET /admin/stats'
    ]
  });
});

app.get('/admin/dashboard', (req, res) => {
  res.json({
    message: '📊 Dashboard de Administrador',
    data: {
      totalVisits: 1250,
      activeUsers: 89,
      totalSales: 15200,
      pendingOrders: 12
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/admin/users', (req, res) => {
  res.json({
    message: '👥 Gestión de Usuarios',
    data: [
      { id: 1, name: 'Ana García', email: 'ana@example.com', role: 'admin', status: 'active' },
      { id: 2, name: 'Carlos López', email: 'carlos@example.com', role: 'user', status: 'active' },
      { id: 3, name: 'María Rodríguez', email: 'maria@example.com', role: 'user', status: 'inactive' }
    ],
    total: 3
  });
});

app.get('/admin/products', (req, res) => {
  res.json({
    message: '📦 Productos (Vista Admin)',
    note: 'Este es el panel de admin. Tus productos reales siguen en http://localhost:3000/api/products',
    sampleProducts: [
      { id: 101, name: 'Laptop Pro', price: 1200, stock: 15, category: 'Electrónica' },
      { id: 102, name: 'Mouse Inalámbrico', price: 45, stock: 3, category: 'Accesorios' }
    ]
  });
});

app.get('/admin/stats', (req, res) => {
  res.json({
    message: '📈 Estadísticas del Sistema',
    period: 'Últimos 30 días',
    metrics: {
      newUsers: 15,
      totalOrders: 89,
      revenue: 12500,
      topCategory: 'Electrónica'
    }
  });
});

// Puerto DIFERENTE para no conflictos
const PORT_ADMIN = 3001;

app.listen(PORT_ADMIN, () => {
  console.log('='.repeat(50));
  console.log(`👑 SERVIDOR ADMIN corriendo en:`);
  console.log(`   🌐 http://localhost:${PORT_ADMIN}/admin`);
  console.log(`   📍 Puerto: ${PORT_ADMIN} (NO interfiere con tu puerto 3000)`);
  console.log('='.repeat(50));
  console.log('\n✅ Tu servidor principal SIGUE funcionando en:');
  console.log(`   🚀 http://localhost:3000/api/products`);
  console.log('\n📌 Prueba ambos:');
  console.log(`   1. Productos: http://localhost:3000/api/products`);
  console.log(`   2. Admin: http://localhost:3001/admin/dashboard`);
});
