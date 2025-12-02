const app = require('./src/app');
const { sequelize } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Sincronizar base de datos y luego iniciar servidor
sequelize.sync({ force: false }).then(() => {
  console.log('Base de datos sincronizada');

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log('Roles disponibles: ADMIN y CAJERO');
  });
}).catch(err => {
  console.error('Error al sincronizar la base de datos:', err);
});
