const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validate');

router.use(authMiddleware);

// Get all products
router.get('/', productController.getAll);

// Get low stock products
router.get('/low-stock', productController.getLowStock);

// Get product stats
router.get('/stats', productController.getStats);

// Get product by ID
router.get('/:id', validators.uuid('id', 'param'), handleValidationErrors, productController.getById);

// Create product (admin only)
router.post('/',
  requireAdmin,
  validators.required('nome_commerciale'),
  validators.required('principio_attivo'),
  handleValidationErrors,
  productController.create
);

// Update product (admin only)
router.put('/:id',
  requireAdmin,
  validators.uuid('id', 'param'),
  handleValidationErrors,
  productController.update
);

// Update stock (admin only)
router.patch('/:id/stock',
  requireAdmin,
  validators.uuid('id', 'param'),
  validators.required('quantity'),
  handleValidationErrors,
  productController.updateStock
);

// Delete product (admin only)
router.delete('/:id',
  requireAdmin,
  validators.uuid('id', 'param'),
  handleValidationErrors,
  productController.delete
);

module.exports = router;
