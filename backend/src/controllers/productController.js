const Product = require('../models/Product');

const productController = {
  getAll: async (req, res, next) => {
    try {
      const { search, lowStock, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const products = await Product.findAll({
        search,
        lowStock: lowStock === 'true',
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const stats = await Product.getStats();

      res.json({
        success: true,
        data: products,
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
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const product = await Product.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Prodotto creato con successo',
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await Product.update(id, req.body);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }

      res.json({
        success: true,
        message: 'Prodotto aggiornato con successo',
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  updateStock: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const product = await Product.updateStock(id, quantity);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }

      res.json({
        success: true,
        message: 'Stock aggiornato con successo',
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await Product.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }

      res.json({
        success: true,
        message: 'Prodotto eliminato con successo'
      });
    } catch (error) {
      next(error);
    }
  },

  getLowStock: async (req, res, next) => {
    try {
      const products = await Product.getLowStock();
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const stats = await Product.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;
