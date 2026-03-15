const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Client {
  static async findAll(options = {}) {
    const { search, active, limit = 50, offset = 0 } = options;
    let sql = `
      SELECT c.*, 
             COUNT(DISTINCT l.id) as numero_sedi,
             COUNT(DISTINCT i.id) as numero_interventi
      FROM clients c
      LEFT JOIN locations l ON l.client_id = c.id
      LEFT JOIN interventions i ON i.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (active !== undefined) {
      sql += ` AND c.attivo = $${paramIndex}`;
      params.push(active);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (c.ragione_sociale ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.piva ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` GROUP BY c.id ORDER BY c.ragione_sociale LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT c.*, 
              COUNT(DISTINCT l.id) as numero_sedi,
              COUNT(DISTINCT i.id) as numero_interventi
       FROM clients c
       LEFT JOIN locations l ON l.client_id = c.id
       LEFT JOIN interventions i ON i.client_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM clients WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  static async create(clientData) {
    const {
      ragione_sociale,
      tipo = 'azienda',
      piva,
      codice_fiscale,
      email,
      telefono,
      indirizzo,
      citta,
      cap,
      provincia,
      note
    } = clientData;

    const id = uuidv4();

    const result = await query(
      `INSERT INTO clients (
        id, ragione_sociale, tipo, piva, codice_fiscale, email, telefono,
        indirizzo, citta, cap, provincia, note, attivo, data_creazione
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())
      RETURNING *`,
      [id, ragione_sociale, tipo, piva, codice_fiscale, email?.toLowerCase(), telefono, indirizzo, citta, cap, provincia, note]
    );

    return result.rows[0];
  }

  static async update(id, updateData) {
    const allowedFields = [
      'ragione_sociale', 'tipo', 'piva', 'codice_fiscale', 'email',
      'telefono', 'indirizzo', 'citta', 'cap', 'provincia', 'note', 'attivo'
    ];
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(key === 'email' ? value?.toLowerCase() : value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    const sql = `UPDATE clients SET ${updates.join(', ')}, data_aggiornamento = NOW() WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    // Soft delete - set attivo = false
    const result = await query(
      'UPDATE clients SET attivo = false, data_aggiornamento = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  static async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE attivo = true) as attivi,
        COUNT(*) FILTER (WHERE attivo = false) as inattivi,
        COUNT(*) FILTER (WHERE data_creazione >= NOW() - INTERVAL '30 days') as nuovi_30gg
      FROM clients
    `);
    return result.rows[0];
  }
}

module.exports = Client;
