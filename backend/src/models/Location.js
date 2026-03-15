const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Location {
  static async findAll(options = {}) {
    const { clientId, search, limit = 50, offset = 0 } = options;
    let sql = `
      SELECT l.*, c.ragione_sociale as cliente_nome
      FROM locations l
      JOIN clients c ON c.id = l.client_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (clientId) {
      sql += ` AND l.client_id = $${paramIndex}`;
      params.push(clientId);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (l.nome_sede ILIKE $${paramIndex} OR l.indirizzo ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY l.nome_sede LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT l.*, c.ragione_sociale as cliente_nome
       FROM locations l
       JOIN clients c ON c.id = l.client_id
       WHERE l.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByClientId(clientId) {
    const result = await query(
      `SELECT * FROM locations WHERE client_id = $1 ORDER BY nome_sede`,
      [clientId]
    );
    return result.rows;
  }

  static async create(locationData) {
    const {
      client_id,
      nome_sede,
      indirizzo,
      citta,
      cap,
      provincia,
      latitudine,
      longitudine,
      note
    } = locationData;

    const id = uuidv4();

    const result = await query(
      `INSERT INTO locations (
        id, client_id, nome_sede, indirizzo, citta, cap, provincia,
        latitudine, longitudine, note, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [id, client_id, nome_sede, indirizzo, citta, cap, provincia, latitudine, longitudine, note]
    );

    return result.rows[0];
  }

  static async update(id, updateData) {
    const allowedFields = [
      'nome_sede', 'indirizzo', 'citta', 'cap', 'provincia',
      'latitudine', 'longitudine', 'note'
    ];
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    const sql = `UPDATE locations SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM locations WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  // Calcola distanza in km tra due coordinate (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raggio della Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = Location;
