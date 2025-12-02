const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userValidation = require('../validations/user.validation');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/role');

router.use(verifyToken);

// Obtener todos los usuarios - SOLO ADMIN
router.get('/',
  checkRole('ADMIN'),
  userController.getAllUsers
);

// Buscar usuarios
router.get('/search',
  checkRole('ADMIN'),
  userController.searchUsers
);

// Obtener cajeros activos
router.get('/cashiers/active',
  checkRole('ADMIN'),
  userController.getActiveCashiers
);

// Obtener usuario por ID
router.get('/:id', userController.getUserById);

// Crear nuevo usuario - SOLO ADMIN
router.post('/',
  checkRole('ADMIN'),
  userValidation.createUserValidation,
  userController.createUser
);

// Actualizar usuario
router.put('/:id',
  userValidation.updateUserValidation,
  userController.updateUser
);

// Eliminar usuario - SOLO ADMIN
router.delete('/:id',
  checkRole('ADMIN'),
  userController.deleteUser
);

// Activar/desactivar usuario - SOLO ADMIN
router.patch('/:id/toggle-active',
  checkRole('ADMIN'),
  userController.toggleUserActive
);

// Obtener estadísticas de ventas por usuario - SOLO ADMIN
router.get('/:id/sales-stats',
  checkRole('ADMIN'),
  userController.getUserSalesStats
);

// Obtener ventas realizadas por un usuario
router.get('/:id/sales', userController.getUserSales);

module.exports = router;
