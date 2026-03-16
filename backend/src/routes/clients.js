const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/clients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, attivo, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (attivo !== undefined) {
      where.attivo = attivo === 'true';
    }
    
    if (search) {
      where.OR = [
        { ragioneSociale: { contains: search } },
        { email: { contains: search } },
        { piva: { contains: search } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { locations: true, interventions: true }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { ragioneSociale: 'asc' }
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

// GET /api/clients/:id/documenti - Fatture/documenti caricati per il cliente
router.get('/:id/documenti', authMiddleware, async (req, res) => {
  try {
    const list = await prisma.documentoCliente.findMany({
      where: { clientId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// POST /api/clients/:id/documenti - Aggiungi documento (url da upload, nome, tipo, dataDocumento)
router.post('/:id/documenti', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    const { url, nome, tipo, dataDocumento } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, message: 'URL documento obbligatorio' });
    }
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente non trovato' });
    }
    const doc = await prisma.documentoCliente.create({
      data: {
        clientId,
        url: url.trim(),
        nome: (nome && nome.trim()) || 'Documento',
        tipo: (tipo && ['fattura', 'report', 'altro'].includes(String(tipo).trim())) ? String(tipo).trim() : 'fattura',
        dataDocumento: dataDocumento ? new Date(dataDocumento) : null
      }
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Errore creazione documento' });
  }
});

// DELETE /api/clients/:id/documenti/:docId
router.delete('/:id/documenti/:docId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id: clientId, docId } = req.params;
    await prisma.documentoCliente.deleteMany({
      where: { id: docId, clientId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore eliminazione' });
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
        interventions: {
          take: 5,
          orderBy: { dataProgrammata: 'desc' },
          include: {
            tecnico: { select: { nome: true, cognome: true } },
            tipoIntervento: { select: { nome: true, colore: true } }
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente non trovato' });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nel recupero cliente' });
  }
});

// POST /api/clients (admin only)
router.post('/',
  authMiddleware,
  requireAdmin,
  validators.required('ragioneSociale'),
  validators.optionalEmail('email'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ragioneSociale, tipo, piva, codiceFiscale, email, telefono, indirizzo, citta, cap, provincia, note, consigliere, telefonoConsigliere } = req.body;
      const nome = (ragioneSociale && typeof ragioneSociale === 'string') ? ragioneSociale.trim() : '';
      if (!nome) {
        return res.status(400).json({ success: false, message: 'Ragione sociale obbligatoria' });
      }
      const data = {
        ragioneSociale: nome,
        tipo: (tipo && ['azienda', 'privato', 'condominio'].includes(tipo)) ? tipo : 'azienda',
        attivo: true
      };
      const setIfPresent = (val) => typeof val === 'string' && val.trim() !== '';
      if (setIfPresent(piva)) data.piva = String(piva).trim();
      if (setIfPresent(codiceFiscale)) data.codiceFiscale = String(codiceFiscale).trim();
      if (setIfPresent(email)) data.email = String(email).trim();
      if (setIfPresent(telefono)) data.telefono = String(telefono).trim();
      if (setIfPresent(indirizzo)) data.indirizzo = String(indirizzo).trim();
      if (setIfPresent(citta)) data.citta = String(citta).trim();
      if (setIfPresent(cap)) data.cap = String(cap).trim();
      if (setIfPresent(provincia)) data.provincia = String(provincia).trim();
      if (setIfPresent(note)) data.note = String(note).trim();
      if (setIfPresent(consigliere)) data.consigliere = String(consigliere).trim();
      if (setIfPresent(telefonoConsigliere)) data.telefonoConsigliere = String(telefonoConsigliere).trim();

      const client = await prisma.client.create({ data });

      res.status(201).json({
        success: true,
        message: 'Cliente creato',
        data: client
      });
    } catch (error) {
      console.error('Create client error:', error);
      const msg = error.code === 'P2002' ? 'Un cliente con questo valore (es. email o P.IVA) esiste già' : (error.message || 'Errore nella creazione');
      res.status(500).json({ success: false, message: msg });
    }
  }
);

// PUT /api/clients/:id
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await prisma.client.update({
      where: { id },
      data: req.body
    });

    res.json({ success: true, message: 'Cliente aggiornato', data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento' });
  }
});

// DELETE /api/clients/:id (soft delete)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.client.update({
      where: { id },
      data: { attivo: false }
    });

    res.json({ success: true, message: 'Cliente disattivato' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nella disattivazione' });
  }
});

module.exports = router;
// DELETE /api/clients/:id (hard delete)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hard delete - elimina completamente il cliente
    await prisma.client.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Cliente eliminato definitivamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Cliente non trovato' });
    }
    console.error('Delete client error:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione' });
  }
});
