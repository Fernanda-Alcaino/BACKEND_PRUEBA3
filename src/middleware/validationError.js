// src/middleware/validationError.js
const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Formatear errores para respuesta
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      error: 'Error de validación',
      details: formattedErrors
    });
  }

  next();
};

module.exports = handleValidationErrors;
