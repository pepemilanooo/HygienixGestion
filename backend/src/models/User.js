const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  static async findAll(options = {}) {
    const { role, active, search, limit = 50, offset = 0 } = options;
    let sql = `
      SELECT id, email, nome, cognome, ruolo, telefono, attivo, 
             data_creazione, ultimo_accesso
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (role) {
      sql += ` AND ruolo = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (active !== undefined) {
      sql += ` AND attivo = $${paramIndex}`;
      params.push(active);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (nome ILIKE $${paramIndex} OR cognome ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY cognome, nome LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT id, email, nome, cognome, ruolo, telefono, attivo, 
              data_creazione, ultimo_accesso 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  static async create(userData) {
    const { email, password, nome, cognome, ruolo = 'tecnico', telefono } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const result = await query(
      `INSERT INTO users (id, email, password, nome, cognome, ruolo, telefono, attivo, data_creazione)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       RETURNING id, email, nome, cognome, ruolo, telefono, attivo, data_creazione`,
      [id, email.toLowerCase(), hashedPassword, nome, cognome, ruolo, telefono]
    );

    return result.rows[0];
  }

  static async update(id, updateData) {
    const allowedFields = ['nome', 'cognome', 'email', 'telefono', 'ruolo', 'attivo'];
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
    const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
    return true;
  }

  static async updateLastLogin(id) {
    await query(
      'UPDATE users SET ultimo_accesso = NOW() WHERE id = $1',
      [id]
    );
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
