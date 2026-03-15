const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Product {
  static async findAll(options = {}) {
    const { search, lowStock, limit = 50, offset = 0 } = options;
    let sql = `
      SELECT *, 
             CASE 
               WHEN quantita_disponibile <= quantita_minima THEN true 
               ELSE false 
             END as sotto_scorta
      FROM products 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (nome_commerciale ILIKE $${paramIndex} OR principio_attivo ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (lowStock) {
      sql += ` AND quantita_disponibile <= quantita_minima`;
    }

    sql += ` ORDER BY nome_commerciale LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT *, 
              CASE 
                WHEN quantita_disponibile <= quantita_minima THEN true 
                ELSE false 
              END as sotto_scorta
       FROM products WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(productData) {
    const {
      nome_commerciale,
      principio_attivo,
      numero_registro,
      categoria,
      unita_misura,
      quantita_disponibile = 0,
      quantita_minima = 0,
      scheda_sicurezza_url
    } = productData;

    const id = uuidv4();

    const result = await query(
      `INSERT INTO products (
        id, nome_commerciale, principio_attivo, numero_registro, categoria,
        unita_misura, quantita_disponibile, quantita_minima, scheda_sicurezza_url,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [id, nome_commerciale, principio_attivo, numero_registro, categoria,
       unita_misura, quantita_disponibile, quantita_minima, scheda_sicurezza_url]
    );

    return result.rows[0];
  }

  static async update(id, updateData) {
    const allowedFields = [
      'nome_commerciale', 'principio_attivo', 'numero_registro', 'categoria',
      'unita_misura', 'quantita_disponibile', 'quantita_minima', 'scheda_sicurezza_url'
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
    const sql = `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  static async updateStock(id, quantity) {
    const result = await query(
      `UPDATE products 
       SET quantita_disponibile = quantita_disponibile + $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  static async getLowStock() {
    const result = await query(
      `SELECT * FROM products 
       WHERE quantita_disponibile <= quantita_minima 
       ORDER BY nome_commerciale`
    );
    return result.rows;
  }

  static async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as totali,
        COUNT(*) FILTER (WHERE quantita_disponibile <= quantita_minima) as sotto_scorta,
        SUM(quantita_disponibile) as stock_totale
      FROM products
    `);
    return result.rows[0];
  }
}

module.exports = Product;
