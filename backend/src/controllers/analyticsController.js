const { query } = require('../config/database');
const Client = require('../models/Client');
const Intervention = require('../models/Intervention');
const Product = require('../models/Product');

const analyticsController = {
  getDashboard: async (req, res, next) => {
    try {
      const clientStats = await Client.getStats();
      const interventionStats = await Intervention.getStats();
      const productStats = await Product.getStats();

      // Recent interventions
      const recentInterventions = await Intervention.findAll({ limit: 5 });

      // Interventions by status
      const statusDistribution = await query(`
        SELECT stato, COUNT(*) as count
        FROM interventions
        GROUP BY stato
      `);

      res.json({
        success: true,
        data: {
          overview: {
            clienti: clientStats,
            interventi: interventionStats,
            prodotti: productStats
          },
          recentInterventions,
          statusDistribution: statusDistribution.rows
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getInterventionsReport: async (req, res, next) => {
    try {
      const { fromDate, toDate, groupBy = 'day' } = req.query;

      let groupClause;
      switch (groupBy) {
        case 'week':
          groupClause = "DATE_TRUNC('week', data_esecuzione)";
          break;
        case 'month':
          groupClause = "DATE_TRUNC('month', data_esecuzione)";
          break;
        default:
          groupClause = "DATE(data_esecuzione)";
      }

      const result = await query(`
        SELECT 
          ${groupClause} as period,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE stato = 'completato') as completati,
          COUNT(*) FILTER (WHERE stato = 'in_corso') as in_corso,
          COUNT(*) FILTER (WHERE stato = 'pianificato') as pianificati
        FROM interventions
        WHERE data_esecuzione BETWEEN $1 AND $2
        GROUP BY period
        ORDER BY period
      `, [fromDate || '2024-01-01', toDate || '2024-12-31']);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  },

  getPestTypesDistribution: async (req, res, next) => {
    try {
      const result = await query(`
        SELECT 
          pt.nome,
          pt.categoria,
          COUNT(i.id) as count
        FROM pest_types pt
        LEFT JOIN interventions i ON i.pest_type_id = pt.id
        GROUP BY pt.id, pt.nome, pt.categoria
        ORDER BY count DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  },

  getProductsUsage: async (req, res, next) => {
    try {
      const { fromDate, toDate } = req.query;

      const result = await query(`
        SELECT 
          p.nome_commerciale,
          p.principio_attivo,
          SUM(pu.quantita_usata) as quantita_totale,
          COUNT(DISTINCT pu.intervention_id) as num_interventi
        FROM products p
        JOIN product_usage pu ON pu.product_id = p.id
        JOIN interventions i ON i.id = pu.intervention_id
        WHERE i.data_esecuzione BETWEEN $1 AND $2
        GROUP BY p.id, p.nome_commerciale, p.principio_attivo
        ORDER BY quantita_totale DESC
      `, [fromDate || '2024-01-01', toDate || '2024-12-31']);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  },

  getTechniciansPerformance: async (req, res, next) => {
    try {
      const { fromDate, toDate } = req.query;

      const result = await query(`
        SELECT 
          u.id,
          u.nome,
          u.cognome,
          COUNT(i.id) as interventi_completati,
          AVG(EXTRACT(EPOCH FROM (i.check_out_time - i.check_in_time))/3600) as tempo_medio_ore,
          COUNT(i.id) FILTER (WHERE i.stato = 'completato') as completati
        FROM users u
        LEFT JOIN interventions i ON i.technician_id = u.id 
          AND i.stato = 'completato'
          AND i.data_esecuzione BETWEEN $1 AND $2
        WHERE u.ruolo = 'tecnico' AND u.attivo = true
        GROUP BY u.id, u.nome, u.cognome
        ORDER BY interventi_completati DESC
      `, [fromDate || '2024-01-01', toDate || '2024-12-31']);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  },

  getMapData: async (req, res, next) => {
    try {
      const { pestTypeId, fromDate, toDate } = req.query;

      let sql = `
        SELECT 
          l.id,
          l.nome_sede,
          l.latitudine,
          l.longitudine,
          c.ragione_sociale as cliente_nome,
          pt.nome as tipo_infestante,
          COUNT(i.id) as num_interventi
        FROM locations l
        JOIN clients c ON c.id = l.client_id
        LEFT JOIN interventions i ON i.location_id = l.id
        LEFT JOIN pest_types pt ON pt.id = i.pest_type_id
        WHERE l.latitudine IS NOT NULL AND l.longitudine IS NOT NULL
      `;
      const params = [];

      if (pestTypeId) {
        sql += ` AND i.pest_type_id = $${params.length + 1}`;
        params.push(pestTypeId);
      }

      if (fromDate) {
        sql += ` AND i.data_esecuzione >= $${params.length + 1}`;
        params.push(fromDate);
      }

      if (toDate) {
        sql += ` AND i.data_esecuzione <= $${params.length + 1}`;
        params.push(toDate);
      }

      sql += ` GROUP BY l.id, l.nome_sede, l.latitudine, l.longitudine, c.ragione_sociale, pt.nome`;

      const result = await query(sql, params);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = analyticsController;
