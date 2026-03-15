const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class PestType {
  static async findAll() {
    const result = await query(
      `SELECT * FROM pest_types ORDER BY nome`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT * FROM pest_types WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { nome, descrizione, categoria, icona } = data;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO pest_types (id, nome, descrizione, categoria, icona)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, nome, descrizione, categoria, icona]
    );
    return result.rows[0];
  }

  static async update(id, updateData) {
    const allowedFields = ['nome', 'descrizione', 'categoria', 'icona'];
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

    if (updates.length === 0) return null;

    values.push(id);
    const sql = `UPDATE pest_types SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM pest_types WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
}

module.exports = PestType;
