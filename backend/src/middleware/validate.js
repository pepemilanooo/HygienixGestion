const { validationResult, body, param, query } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errore di validazione',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

const validators = {
  uuid: (field, location = 'param') => {
    const validator = location === 'param' ? param(field) : body(field);
    return validator
      .isUUID()
      .withMessage(`${field} deve essere un UUID valido`);
  },
  
  email: (field = 'email') => 
    body(field)
      .isEmail()
      .normalizeEmail()
      .withMessage('Email non valida'),
  
  optionalEmail: (field = 'email') =>
    body(field)
      .optional({ checkFalsy: true })
      .isEmail()
      .normalizeEmail()
      .withMessage('Email non valida'),
  
  password: (field = 'password') =>
    body(field)
      .isLength({ min: 6 })
      .withMessage('Password deve essere di almeno 6 caratteri'),
  
  required: (field, location = 'body') => {
    const validator = location === 'body' ? body(field) : param(field);
    return validator
      .notEmpty()
      .trim()
      .withMessage(`${field} è obbligatorio`);
  }
};

module.exports = {
  handleValidationErrors,
  validators
};
