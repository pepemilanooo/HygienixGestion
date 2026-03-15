const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');
const { authMiddleware, requireAdmin, requireTechnician } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validate');

router.use(authMiddleware);

// Get all technicians
router.get('/', technicianController.getAll);

// Get technician by ID
router.get('/:id',
  validators.uuid('id', 'param'),
  handleValidationErrors,
  technicianController.getById
);

// Get technician interventions
router.get('/:id/interventions',
  validators.uuid('id', 'param'),
  handleValidationErrors,
  technicianController.getInterventions
);

// Get technician schedule
router.get('/:id/schedule',
  validators.uuid('id', 'param'),
  handleValidationErrors,
  technicianController.getSchedule
);

// Get today's interventions for logged technician
router.get('/me/today', requireTechnician, technicianController.getTodayInterventions);

// Update technician
router.put('/:id',
  validators.uuid('id', 'param'),
  handleValidationErrors,
  technicianController.update
);

module.exports = router;
