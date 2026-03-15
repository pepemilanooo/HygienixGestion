const Location = require('../models/Location');
const Client = require('../models/Client');

const locationController = {
  getAll: async (req, res, next) => {
    try {
      const { clientId, search, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const locations = await Location.findAll({
        clientId,
        search,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const location = await Location.findById(id);

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Sede non trovata'
        });
      }

      res.json({
        success: true,
        data: location
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      // Verify client exists
      const client = await Client.findById(req.body.client_id);
      if (!client) {
        return res.status(400).json({
          success: false,
          message: 'Cliente non trovato'
        });
      }

      const location = await Location.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Sede creata con successo',
        data: location
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const location = await Location.update(id, req.body);

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Sede non trovata'
        });
      }

      res.json({
        success: true,
        message: 'Sede aggiornata con successo',
        data: location
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await Location.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Sede non trovata'
        });
      }

      res.json({
        success: true,
        message: 'Sede eliminata con successo'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = locationController;
