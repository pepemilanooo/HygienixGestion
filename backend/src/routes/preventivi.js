const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Genera prossimo numero preventivo
async function getProssimoNumero() {
  const last = await prisma.preventivo.findFirst({ orderBy: { createdAt: 'desc' }, select: { numero: true } });
  const n = last ? parseInt(last.numero.replace(/\D/g, ''), 10) || 0 : 0;
  const year = new Date().getFullYear();
  return `PREV-${year}-${String(n + 1).padStart(4, '0')}`;
}

// GET /api/preventivi
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, stato, page = 1, limit = 50 } = req.query;
    const where = {};
    if (clientId) where.clientId = clientId;
    if (stato) where.stato = stato;

    const [list, total] = await Promise.all([
      prisma.preventivo.findMany({
        where,
        include: { client: { select: { ragioneSociale: true } } },
        orderBy: { data: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.preventivo.count({ where })
    ]);
    res.json({ success: true, data: list, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// GET /api/preventivi/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const p = await prisma.preventivo.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        righe: { orderBy: { ordine: 'asc' } },
        fattura: true
      }
    });
    if (!p) return res.status(404).json({ success: false, message: 'Preventivo non trovato' });
    res.json({ success: true, data: p });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// POST /api/preventivi
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { clientId, data, scadenza, stato, note, righe } = req.body;
    const numero = await getProssimoNumero();

    let subtotale = 0;
    const righeCreate = (righe || []).map((r, i) => {
      const tot = (r.quantita || 1) * (r.prezzoUnitario || 0);
      subtotale += tot;
      return {
        descrizione: r.descrizione || '',
        quantita: r.quantita ?? 1,
        prezzoUnitario: r.prezzoUnitario ?? 0,
        totale: tot,
        ordine: i
      };
    });
    const iva = subtotale * 0.22;
    const totale = subtotale + iva;

    const preventivo = await prisma.preventivo.create({
      data: {
        numero,
        clientId,
        data: data ? new Date(data) : new Date(),
        scadenza: scadenza ? new Date(scadenza) : null,
        stato: stato || 'bozza',
        subtotale,
        iva,
        totale,
        note: note || null,
        righe: { create: righeCreate }
      },
      include: {
        client: { select: { ragioneSociale: true } },
        righe: true
      }
    });
    res.status(201).json({ success: true, data: preventivo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Errore creazione preventivo' });
  }
});

// PUT /api/preventivi/:id
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { data, scadenza, stato, note, righe } = req.body;
    const id = req.params.id;

    if (righe && Array.isArray(righe)) {
      await prisma.rigaPreventivo.deleteMany({ where: { preventivoId: id } });
      let subtotale = 0;
      const righeCreate = righe.map((r, i) => {
        const tot = (r.quantita || 1) * (r.prezzoUnitario || 0);
        subtotale += tot;
        return {
          descrizione: r.descrizione || '',
          quantita: r.quantita ?? 1,
          prezzoUnitario: r.prezzoUnitario ?? 0,
          totale: tot,
          ordine: i
        };
      });
      const iva = subtotale * 0.22;
      const totale = subtotale + iva;
      const preventivo = await prisma.preventivo.update({
        where: { id },
        data: {
          ...(data && { data: new Date(data) }),
          ...(scadenza !== undefined && { scadenza: scadenza ? new Date(scadenza) : null }),
          ...(stato && { stato }),
          ...(note !== undefined && { note }),
          subtotale,
          iva,
          totale,
          righe: { create: righeCreate }
        },
        include: { client: true, righe: true }
      });
      return res.json({ success: true, data: preventivo });
    }

    const preventivo = await prisma.preventivo.update({
      where: { id },
      data: {
        ...(data && { data: new Date(data) }),
        ...(scadenza !== undefined && { scadenza: scadenza ? new Date(scadenza) : null }),
        ...(stato && { stato }),
        ...(note !== undefined && { note })
      },
      include: { client: true, righe: true }
    });
    res.json({ success: true, data: preventivo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Errore aggiornamento' });
  }
});

// DELETE /api/preventivi/:id
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await prisma.preventivo.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

module.exports = router;
