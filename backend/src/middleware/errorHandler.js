const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Errore interno del server';
  let errors = err.errors || null;

  // PostgreSQL unique violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Dato già esistente (duplicato)';
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Riferimento a dato inesistente';
  }

  // PostgreSQL not null violation
  if (err.code === '23502') {
    statusCode = 400;
    message = 'Campo obbligatorio mancante';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token non valido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token scaduto';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Errore di validazione';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    code: err.code || err.name || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler };
