const Client = require('../models/Client');
const Location = require('../models/Location');

const clientController = {
  getAll: async (req, res, next) => {
    try {
      const { search, active, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      const clients = await Client.findAll({
        search,
        active: active !== undefined ? active === 'true' : undefined,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const stats = await Client.getStats();

      res.json({
        success: true,
        data: clients,
        meta: {
          total: parseInt(stats.totali),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const client = await Client.findById(id);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente non trovato'
        });
      }

      // Get locations
      const locations = await Location.findByClientId(id);

      res.json({
        success: true,
        data: {
          ...client,
          sedi: locations
        }
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const client = await Client.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Cliente creato con successo',
        data: client
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const client = await Client.update(id, req.body);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente non trovato'
        });
      }

      res.json({
        success: true,
        message: 'Cliente aggiornato con successo',
        data: client
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await Client.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Cliente non trovato'
        });
      }

      res.json({
        success: true,
        message: 'Cliente eliminato con successo'
      });
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const stats = await Client.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = clientController;
