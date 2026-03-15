const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/locations?clientId=xxx
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { clientId } = req.query;
    
    const where = {};
    if (clientId) where.clientId = clientId;

    const locations = await prisma.location.findMany({
      where,
      include: {
        client: { select: { ragioneSociale: true } }
      },
      orderBy: { nomeSede: 'asc' }
    });

    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// GET /api/locations/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: { client: true }
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Sede non trovata' });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// POST /api/locations
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const location = await prisma.location.create({
      data: req.body,
      include: { client: { select: { ragioneSociale: true } } }
    });

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore creazione' });
  }
});

// PUT /api/locations/:id
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const location = await prisma.location.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore aggiornamento' });
  }
});

// DELETE /api/locations/:id
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Sede eliminata' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore eliminazione' });
  }
});

module.exports = router;
