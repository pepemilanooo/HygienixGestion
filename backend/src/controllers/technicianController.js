const User = require('../models/User');
const Intervention = require('../models/Intervention');

const technicianController = {
  getAll: async (req, res, next) => {
    try {
      const { search, active, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const technicians = await User.findAll({
        role: 'tecnico',
        active: active !== undefined ? active === 'true' : true,
        search,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: technicians
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const technician = await User.findById(id);

      if (!technician || technician.ruolo !== 'tecnico') {
        return res.status(404).json({
          success: false,
          message: 'Tecnico non trovato'
        });
      }

      // Get intervention stats
      const stats = await Intervention.getStats(id);

      res.json({
        success: true,
        data: {
          ...technician,
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getInterventions: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, fromDate, toDate } = req.query;

      // If user is technician, can only see own interventions
      if (req.user.ruolo === 'tecnico' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato'
        });
      }

      const interventions = await Intervention.findAll({
        technicianId: id,
        status,
        fromDate,
        toDate,
        limit: 100
      });

      res.json({
        success: true,
        data: interventions
      });
    } catch (error) {
      next(error);
    }
  },

  getSchedule: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { fromDate, toDate } = req.query;

      // If user is technician, can only see own schedule
      if (req.user.ruolo === 'tecnico' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato'
        });
      }

      const interventions = await Intervention.findAll({
        technicianId: id,
        status: 'pianificato',
        fromDate,
        toDate,
        limit: 200
      });

      res.json({
        success: true,
        data: interventions
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Technicians can only update themselves
      if (req.user.ruolo === 'tecnico' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato'
        });
      }

      // Only allow certain fields for self-update
      const allowedUpdates = {};
      if (req.body.telefono) allowedUpdates.telefono = req.body.telefono;
      if (req.body.nome) allowedUpdates.nome = req.body.nome;
      if (req.body.cognome) allowedUpdates.cognome = req.body.cognome;

      const technician = await User.update(id, allowedUpdates);

      if (!technician) {
        return res.status(404).json({
          success: false,
          message: 'Tecnico non trovato'
        });
      }

      res.json({
        success: true,
        message: 'Profilo aggiornato con successo',
        data: technician
      });
    } catch (error) {
      next(error);
    }
  },

  getTodayInterventions: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const interventions = await Intervention.getTodayInterventions(userId);

      res.json({
        success: true,
        data: interventions
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = technicianController;
