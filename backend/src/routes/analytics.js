const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

router.use(authMiddleware);

// Dashboard overview
router.get('/dashboard', analyticsController.getDashboard);

// Interventions report
router.get('/interventions', analyticsController.getInterventionsReport);

// Pest types distribution
router.get('/pest-types', analyticsController.getPestTypesDistribution);

// Products usage
router.get('/products-usage', analyticsController.getProductsUsage);

// Technicians performance
router.get('/technicians-performance', analyticsController.getTechniciansPerformance);

// Map data
router.get('/map-data', analyticsController.getMapData);

module.exports = router;
