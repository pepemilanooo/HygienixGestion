const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const notificationController = {
  getAll: async (req, res, next) => {
    try {
      const { unreadOnly, limit = 50 } = req.query;
      const userId = req.user.id;

      let sql = `
        SELECT * FROM notifications
        WHERE user_id = $1
      `;
      const params = [userId];

      if (unreadOnly === 'true') {
        sql += ` AND letta = false`;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await query(sql, params);

      // Get unread count
      const countResult = await query(
        'SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND letta = false',
        [userId]
      );

      res.json({
        success: true,
        data: result.rows,
        meta: {
          unread: parseInt(countResult.rows[0].unread)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await query(
        `UPDATE notifications SET letta = true WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notifica non trovata'
        });
      }

      res.json({
        success: true,
        message: 'Notifica segnata come letta',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;

      await query(
        `UPDATE notifications SET letta = true WHERE user_id = $1 AND letta = false`,
        [userId]
      );

      res.json({
        success: true,
        message: 'Tutte le notifiche segnate come lette'
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await query(
        `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notifica non trovata'
        });
      }

      res.json({
        success: true,
        message: 'Notifica eliminata'
      });
    } catch (error) {
      next(error);
    }
  },

  // Internal method to create notifications
  createNotification: async (userId, title, message, type = 'general') => {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO notifications (id, user_id, titolo, messaggio, tipo, letta, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW()) RETURNING *`,
      [id, userId, title, message, type]
    );
    return result.rows[0];
  }
};

module.exports = notificationController;
