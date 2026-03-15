const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

async function getProssimoNumero() {
  const last = await prisma.fattura.findFirst({ orderBy: { createdAt: 'desc' }, select: { numero: true } });
  const n = last ? parseInt(last.numero.replace(/\D/g, ''), 10) || 0 : 0;
  const year = new Date().getFullYear();
  return `FATT-${year}-${String(n + 1).padStart(4, '0')}`;
}

// GET /api/fatture
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, statoPagamento, page = 1, limit = 50 } = req.query;
    const where = {};
    if (clientId) where.clientId = clientId;
    if (statoPagamento) where.statoPagamento = statoPagamento;

    const [list, total] = await Promise.all([
      prisma.fattura.findMany({
        where,
        include: { client: { select: { ragioneSociale: true } } },
        orderBy: { data: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.fattura.count({ where })
    ]);
    res.json({ success: true, data: list, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// GET /api/fatture/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const f = await prisma.fattura.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        preventivo: true,
        righe: { orderBy: { ordine: 'asc' } }
      }
    });
    if (!f) return res.status(404).json({ success: false, message: 'Fattura non trovata' });
    res.json({ success: true, data: f });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// POST /api/fatture (da preventivo o da zero)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { clientId, preventivoId, data, scadenzaPagamento, note, righe } = req.body;
    const numero = await getProssimoNumero();

    let righeCreate = [];
    let subtotale = 0;
    let targetClientId = clientId;

    if (preventivoId) {
      const prev = await prisma.preventivo.findUnique({
        where: { id: preventivoId },
        include: { righe: true }
      });
      if (!prev) return res.status(404).json({ success: false, message: 'Preventivo non trovato' });
      targetClientId = prev.clientId;
      subtotale = prev.subtotale;
      righeCreate = prev.righe.map((r, i) => ({
        descrizione: r.descrizione,
        quantita: r.quantita,
        prezzoUnitario: r.prezzoUnitario,
        totale: r.totale,
        ordine: i
      }));
    } else if (righe && righe.length) {
      righeCreate = righe.map((r, i) => {
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
    }

    const iva = subtotale * 0.22;
    const totale = subtotale + iva;

    if (!targetClientId) return res.status(400).json({ success: false, message: 'clientId obbligatorio' });

    const fattura = await prisma.fattura.create({
      data: {
        numero,
        clientId: targetClientId,
        preventivoId: preventivoId || null,
        data: data ? new Date(data) : new Date(),
        scadenzaPagamento: scadenzaPagamento ? new Date(scadenzaPagamento) : null,
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
    res.status(201).json({ success: true, data: fattura });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Errore creazione fattura' });
  }
});

// PUT /api/fatture/:id (es. segna come pagata)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { statoPagamento, scadenzaPagamento } = req.body;
    const fattura = await prisma.fattura.update({
      where: { id: req.params.id },
      data: {
        ...(statoPagamento && { statoPagamento }),
        ...(scadenzaPagamento !== undefined && { scadenzaPagamento: scadenzaPagamento ? new Date(scadenzaPagamento) : null })
      },
      include: { client: true, righe: true }
    });
    res.json({ success: true, data: fattura });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

module.exports = router;
