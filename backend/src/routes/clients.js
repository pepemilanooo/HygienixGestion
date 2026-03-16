const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/clients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, active, page = 1, limit = 50 } = req.query;
    const where = {};
    
    if (active !== undefined) where.attivo = active === 'true';
    
    if (search) {
      where.OR = [
        { ragioneSociale: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { piva: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { ragioneSociale: 'asc' },
        include: {
          _count: {
            select: { locations: true, interventions: true }
          }
        }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      success: true,
      data: clients,
      meta: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero clienti' });
  }
});

// GET /api/clients/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        locations: true,
        documenti: { orderBy: { createdAt: 'desc' } },
        _count: {
          select: { interventions: true }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente non trovato' });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero cliente' });
  }
});

// PUT /api/clients/:id
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log per debug
    console.log('Update client - ID:', id);
    console.log('Update client - Body:', JSON.stringify(req.body, null, 2));
    
    const {
      ragioneSociale,
      tipo,
      piva,
      codiceFiscale,
      email,
      telefono,
      indirizzo,
      citta,
      cap,
      provincia,
      note,
      consigliere,
      telefonoConsigliere,
      attivo,
      contrattoUrl,
    } = req.body;

    const data = {};

    // Solo campi effettivamente inviati
    if (ragioneSociale !== undefined) {
      if (typeof ragioneSociale === 'string' && ragioneSociale.trim()) {
        data.ragioneSociale = ragioneSociale.trim();
      }
    }
    if (tipo !== undefined) {
      if (typeof tipo === 'string' && ['azienda', 'privato', 'condominio'].includes(tipo)) {
        data.tipo = tipo;
      }
    }
    if (piva !== undefined) {
      data.piva = typeof piva === 'string' ? (piva.trim() || null) : null;
    }
    if (codiceFiscale !== undefined) {
      data.codiceFiscale = typeof codiceFiscale === 'string' ? (codiceFiscale.trim() || null) : null;
    }
    if (email !== undefined) {
      data.email = typeof email === 'string' ? (email.trim() || null) : null;
    }
    if (telefono !== undefined) {
      data.telefono = typeof telefono === 'string' ? (telefono.trim() || null) : null;
    }
    if (indirizzo !== undefined) {
      data.indirizzo = typeof indirizzo === 'string' ? (indirizzo.trim() || null) : null;
    }
    if (citta !== undefined) {
      data.citta = typeof citta === 'string' ? (citta.trim() || null) : null;
    }
    if (cap !== undefined) {
      data.cap = typeof cap === 'string' ? (cap.trim() || null) : null;
    }
    if (provincia !== undefined) {
      data.provincia = typeof provincia === 'string' ? (provincia.trim() || null) : null;
    }
    if (note !== undefined) {
      data.note = typeof note === 'string' ? (note.trim() || null) : null;
    }
    if (consigliere !== undefined) {
      data.consigliere = typeof consigliere === 'string' ? (consigliere.trim() || null) : null;
    }
    if (telefonoConsigliere !== undefined) {
      data.telefonoConsigliere = typeof telefonoConsigliere === 'string' ? (telefonoConsigliere.trim() || null) : null;
    }
    if (attivo !== undefined) {
      if (typeof attivo === 'boolean') data.attivo = attivo;
    }
    if (contrattoUrl !== undefined) {
      data.contrattoUrl = typeof contrattoUrl === 'string' ? (contrattoUrl.trim() || null) : null;
    }

    console.log('Update client - Data to update:', JSON.stringify(data, null, 2));

    // Verifica che il cliente esista prima di aggiornare
    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      return res.status(404).json({ success: false, message: 'Cliente non trovato' });
    }

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Cliente aggiornato con successo', data: client });
  } catch (error) {
    console.error('Update client error:', error);
    
    // Errori specifici di Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: 'Un cliente con questi dati (es. email o P.IVA) esiste già' 
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente non trovato' 
      });
    }
    
    // Errore generico con dettagli
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiornamento: ' + (error.message || 'Errore sconosciuto'),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.client.delete({ where: { id } });
    
    res.json({ success: true, message: 'Cliente eliminato' });
  } catch (error) {
    console.error('Delete client error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Cliente non trovato' });
    }
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione' });
  }
});

module.exports = router;
