const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/clients - Lista clienti
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

// GET /api/clients/:id - Dettaglio cliente
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

// POST /api/clients - Crea nuovo cliente (admin)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      ragioneSociale,
      tipo = 'azienda',
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
    } = req.body;

    // Validazione campi obbligatori
    if (!ragioneSociale || !ragioneSociale.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ragione sociale è obbligatoria' 
      });
    }

    const data = {
      ragioneSociale: ragioneSociale.trim(),
      tipo: tipo || 'azienda',
      piva: piva?.trim() || null,
      codiceFiscale: codiceFiscale?.trim() || null,
      email: email?.trim() || null,
      telefono: telefono?.trim() || null,
      indirizzo: indirizzo?.trim() || null,
      citta: citta?.trim() || null,
      cap: cap?.trim() || null,
      provincia: provincia?.trim() || null,
      note: note?.trim() || null,
      consigliere: consigliere?.trim() || null,
      telefonoConsigliere: telefonoConsigliere?.trim() || null,
      attivo: true,
    };

    const client = await prisma.client.create({ data });

    res.status(201).json({ 
      success: true, 
      message: 'Cliente creato con successo', 
      data: client 
    });
  } catch (error) {
    console.error('Create client error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: 'Un cliente con questi dati (es. email o P.IVA) esiste già' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella creazione del cliente: ' + (error.message || 'Errore sconosciuto')
    });
  }
});

// PUT /api/clients/:id - Aggiorna cliente (admin)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
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
    } = req.body;

    const data = {};

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

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Cliente aggiornato con successo', data: client });
  } catch (error) {
    console.error('Update client error:', error);
    
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
    
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiornamento: ' + (error.message || 'Errore sconosciuto')
    });
  }
});

// DELETE /api/clients/:id - Elimina cliente (admin)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.client.delete({ where: { id } });
    
    res.json({ success: true, message: 'Cliente eliminato con successo' });
  } catch (error) {
    console.error('Delete client error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Cliente non trovato' });
    }
    
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione' });
  }
});

module.exports = router;
