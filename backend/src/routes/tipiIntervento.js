const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tipi-intervento
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tipi = await prisma.tipoIntervento.findMany({
      where: { attivo: true },
      orderBy: { nome: 'asc' }
    });
    res.json({ success: true, data: tipi });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// GET /api/tipi-intervento/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const tipo = await prisma.tipoIntervento.findUnique({
      where: { id: req.params.id }
    });
    if (!tipo) return res.status(404).json({ success: false, message: 'Non trovato' });
    res.json({ success: true, data: tipo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// POST (admin)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const tipo = await prisma.tipoIntervento.create({ data: req.body });
    res.status(201).json({ success: true, data: tipo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore creazione' });
  }
});

// PUT (admin)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const tipo = await prisma.tipoIntervento.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: tipo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

module.exports = router;
