const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/settings - tutti i settings (chiave-valore)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await prisma.setting.findMany();
    const data = list.reduce((acc, s) => ({ ...acc, [s.chiave]: s.valore }), {});
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// PUT /api/settings - aggiorna (body: { chiave: valore, ... })
router.put('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({ success: false, message: 'Body non valido' });
    }
    for (const [chiave, valore] of Object.entries(body)) {
      if (typeof chiave !== 'string' || typeof valore !== 'string') continue;
      await prisma.setting.upsert({
        where: { chiave },
        update: { valore },
        create: { chiave, valore }
      });
    }
    const list = await prisma.setting.findMany();
    const data = list.reduce((acc, s) => ({ ...acc, [s.chiave]: s.valore }), {});
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

module.exports = router;
