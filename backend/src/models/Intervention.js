const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Intervention {
  static async findAll(options = {}) {
    const {
      clientId,
      technicianId,
      locationId,
      status,
      fromDate,
      toDate,
      search,
      limit = 50,
      offset = 0
    } = options;

    let sql = `
      SELECT i.*, 
             c.ragione_sociale as cliente_nome,
             l.nome_sede as sede_nome,
             l.indirizzo as sede_indirizzo,
             u.nome as tecnico_nome,
             u.cognome as tecnico_cognome,
             pt.nome as tipo_infestante
      FROM interventions i
      JOIN clients c ON c.id = i.client_id
      JOIN locations l ON l.id = i.location_id
      LEFT JOIN users u ON u.id = i.technician_id
      LEFT JOIN pest_types pt ON pt.id = i.pest_type_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (clientId) {
      sql += ` AND i.client_id = $${paramIndex}`;
      params.push(clientId);
      paramIndex++;
    }

    if (technicianId) {
      sql += ` AND i.technician_id = $${paramIndex}`;
      params.push(technicianId);
      paramIndex++;
    }

    if (locationId) {
      sql += ` AND i.location_id = $${paramIndex}`;
      params.push(locationId);
      paramIndex++;
    }

    if (status) {
      sql += ` AND i.stato = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fromDate) {
      sql += ` AND i.data_programmata >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      sql += ` AND i.data_programmata <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    sql += ` ORDER BY i.data_programmata DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT i.*, 
              c.ragione_sociale as cliente_nome,
              l.nome_sede as sede_nome,
              l.indirizzo as sede_indirizzo,
              l.latitudine as sede_lat,
              l.longitudine as sede_lng,
              u.nome as tecnico_nome,
              u.cognome as tecnico_cognome,
              pt.nome as tipo_infestante,
              tm.nome as metodo_trattamento
       FROM interventions i
       JOIN clients c ON c.id = i.client_id
       JOIN locations l ON l.id = i.location_id
       LEFT JOIN users u ON u.id = i.technician_id
       LEFT JOIN pest_types pt ON pt.id = i.pest_type_id
       LEFT JOIN treatment_methods tm ON tm.id = i.treatment_method_id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async getPhotos(interventionId) {
    const result = await query(
      `SELECT * FROM intervention_photos WHERE intervention_id = $1 ORDER BY uploaded_at`,
      [interventionId]
    );
    return result.rows;
  }

  static async getProductUsage(interventionId) {
    const result = await query(
      `SELECT pu.*, p.nome_commerciale, p.principio_attivo
       FROM product_usage pu
       JOIN products p ON p.id = pu.product_id
       WHERE pu.intervention_id = $1`,
      [interventionId]
    );
    return result.rows;
  }

  static async create(interventionData) {
    const {
      client_id,
      location_id,
      technician_id,
      data_programmata,
      pest_type_id,
      treatment_method_id,
      note_interne,
      ricorrenza = 'none',
      intervento_padre_id
    } = interventionData;

    const id = uuidv4();
    const stato = technician_id ? 'pianificato' : 'da_pianificare';

    const result = await query(
      `INSERT INTO interventions (
        id, client_id, location_id, technician_id, data_programmata, stato,
        pest_type_id, treatment_method_id, note_interne, ricorrenza,
        intervento_padre_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [id, client_id, location_id, technician_id, data_programmata, stato,
       pest_type_id, treatment_method_id, note_interne, ricorrenza, intervento_padre_id]
    );

    return result.rows[0];
  }

  static async update(id, updateData) {
    const allowedFields = [
      'technician_id', 'data_programmata', 'data_esecuzione', 'stato',
      'pest_type_id', 'treatment_method_id', 'note_tecnico', 'note_interne',
      'temperatura', 'umidita', 'check_in_lat', 'check_in_lng', 'check_in_time',
      'check_out_time', 'firma_cliente_url', 'report_pdf_url'
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
    const sql = `UPDATE interventions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  static async addPhoto(interventionId, photoUrl, type, description) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO intervention_photos (id, intervention_id, foto_url, tipo, descrizione, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [id, interventionId, photoUrl, type, description]
    );
    return result.rows[0];
  }

  static async addProductUsage(interventionId, productId, quantity, unit, notes) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO product_usage (id, intervention_id, product_id, quantita_usata, unita_misura, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [id, interventionId, productId, quantity, unit, notes]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM interventions WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  static async getStats(technicianId = null) {
    let sql = `
      SELECT 
        COUNT(*) FILTER (WHERE stato = 'completato') as completati,
        COUNT(*) FILTER (WHERE stato = 'in_corso') as in_corso,
        COUNT(*) FILTER (WHERE stato = 'pianificato') as pianificati,
        COUNT(*) FILTER (WHERE stato = 'da_pianificare') as da_pianificare,
        COUNT(*) as totali
      FROM interventions
      WHERE 1=1
    `;
    const params = [];

    if (technicianId) {
      sql += ` AND technician_id = $1`;
      params.push(technicianId);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async getTodayInterventions(technicianId) {
    const result = await query(
      `SELECT i.*, c.ragione_sociale as cliente_nome, l.nome_sede, l.indirizzo, l.latitudine, l.longitudine
       FROM interventions i
       JOIN clients c ON c.id = i.client_id
       JOIN locations l ON l.id = i.location_id
       WHERE i.technician_id = $1 
       AND DATE(i.data_programmata) = CURRENT_DATE
       AND i.stato IN ('pianificato', 'in_corso')
       ORDER BY i.data_programmata`,
      [technicianId]
    );
    return result.rows;
  }
}

module.exports = Intervention;
