const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/prodotti
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { lowStock } = req.query;

    const prodotti = await prisma.prodotto.findMany({
      orderBy: { nomeCommerciale: 'asc' }
    });

    const withStockStatus = prodotti.map(p => ({
      ...p,
      sottoScorta: p.quantitaDisponibile <= p.quantitaMinima
    }));

    const data = lowStock === 'true' ? withStockStatus.filter(p => p.sottoScorta) : withStockStatus;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// GET /api/prodotti/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const prodotto = await prisma.prodotto.findUnique({
      where: { id: req.params.id }
    });
    if (!prodotto) return res.status(404).json({ success: false, message: 'Non trovato' });
    res.json({ success: true, data: prodotto });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// POST (admin)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const prodotto = await prisma.prodotto.create({ data: req.body });
    res.status(201).json({ success: true, data: prodotto });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// PUT (admin)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const prodotto = await prisma.prodotto.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: prodotto });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

module.exports = router;
