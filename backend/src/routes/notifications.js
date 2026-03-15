const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validate');

router.use(authMiddleware);

// Get all notifications
router.get('/', notificationController.getAll);

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// Mark as read
router.put('/:id/read',
  validators.uuid('id', 'param'),
  handleValidationErrors,
  notificationController.markAsRead
);

// Delete notification
router.delete('/:id',
  validators.uuid('id', 'param'),
  handleValidationErrors,
  notificationController.delete
);

module.exports = router;
