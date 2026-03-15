const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalClients,
      newClients,
      totalInterventions,
      todayInterventions,
      pendingInterventions,
      completedInterventions,
      lowStockProducts,
      recentInterventions,
      interventiPerMese
    ] = await Promise.all([
      prisma.client.count({ where: { attivo: true } }),
      prisma.client.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.intervention.count(),
      prisma.intervention.count({
        where: {
          dataProgrammata: { gte: today, lt: tomorrow }
        }
      }),
      prisma.intervention.count({ where: { stato: 'pianificato' } }),
      prisma.intervention.count({ where: { stato: 'completato' } }),
      prisma.prodotto.findMany({ select: { quantitaDisponibile: true, quantitaMinima: true } })
        .then(prodotti => prodotti.filter(p => p.quantitaDisponibile <= p.quantitaMinima).length),
      prisma.intervention.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { ragioneSociale: true } },
          location: { select: { nomeSede: true } },
          tipoIntervento: { select: { nome: true } }
        }
      }),
      prisma.intervention.findMany({
        where: { dataProgrammata: { gte: sixMonthsAgo } },
        select: { dataProgrammata: true }
      }).then(interventi => {
        const byMonth = {};
        interventi.forEach(i => {
          const d = new Date(i.dataProgrammata);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          byMonth[key] = (byMonth[key] || 0) + 1;
        });
        return Object.entries(byMonth).map(([mese, totale]) => ({ mese, totale })).sort((a, b) => a.mese.localeCompare(b.mese));
      })
    ]);

    res.json({
      success: true,
      data: {
        clients: {
          total: totalClients,
          newThisMonth: newClients
        },
        interventions: {
          total: totalInterventions,
          today: todayInterventions,
          pending: pendingInterventions,
          completed: completedInterventions
        },
        inventory: {
          lowStock: lowStockProducts
        },
        recent: recentInterventions,
        interventiPerMese: interventiPerMese || []
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

module.exports = router;
