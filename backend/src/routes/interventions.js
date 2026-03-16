const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin, requireTecnico } = require('../middleware/auth');
const { haversineDistance } = require('../utils/helpers');
const { saveInterventionReport } = require('../services/interventionReportPdf');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/interventions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      stato, 
      tecnicoId, 
      clientId, 
      from, 
      to, 
      tipoCodice,
      page = 1, 
      limit = 50 
    } = req.query;

    const where = {};

    // Filtro per tipo (es. solo sopralluoghi: tipoCodice=SOPR)
    if (tipoCodice) {
      const tipo = await prisma.tipoIntervento.findUnique({ where: { codice: String(tipoCodice).toUpperCase() } });
      if (tipo) where.tipoInterventoId = tipo.id;
    }

    // Filter by role
    if (req.user.ruolo === 'tecnico') {
      where.tecnicoId = req.user.id;
    } else if (tecnicoId) {
      where.tecnicoId = tecnicoId;
    }

    if (stato) where.stato = stato;
    if (clientId) where.clientId = clientId;
    
    if (from || to) {
      where.dataProgrammata = {};
      if (from) where.dataProgrammata.gte = new Date(from);
      if (to) where.dataProgrammata.lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [interventions, total] = await Promise.all([
      prisma.intervention.findMany({
        where,
        include: {
          client: { select: { ragioneSociale: true } },
          location: { select: { nomeSede: true, indirizzo: true, latitudine: true, longitudine: true } },
          tecnico: { select: { nome: true, cognome: true } },
          tipoIntervento: { select: { nome: true, colore: true } },
          _count: { select: { foto: true, prodotti: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { dataProgrammata: 'desc' }
      }),
      prisma.intervention.count({ where })
    ]);

    res.json({
      success: true,
      data: interventions,
      meta: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    console.error('Get interventions error:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero interventi' });
  }
});

// GET /api/interventions/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: {
        client: true,
        location: true,
        tecnico: { select: { id: true, nome: true, cognome: true, telefono: true } },
        tipoIntervento: true,
        foto: true,
        prodotti: {
          include: { prodotto: true }
        }
      }
    });

    if (!intervention) {
      return res.status(404).json({ success: false, message: 'Intervento non trovato' });
    }

    // Check permission
    if (req.user.ruolo === 'tecnico' && intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }

    res.json({ success: true, data: intervention });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nel recupero' });
  }
});

// POST /api/interventions (admin only)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { clientId, locationId, tipoInterventoId, dataProgrammata, tecnicoId, noteInterne } = req.body;
    if (!clientId || !locationId || !tipoInterventoId || !dataProgrammata) {
      return res.status(400).json({
        success: false,
        message: 'Cliente, sede, tipo intervento e data/ora sono obbligatori'
      });
    }
    const data = {
      clientId: String(clientId).trim(),
      locationId: String(locationId).trim(),
      tipoInterventoId: String(tipoInterventoId).trim(),
      dataProgrammata: new Date(dataProgrammata),
      noteInterne: noteInterne && String(noteInterne).trim() ? String(noteInterne).trim() : null
    };
    if (tecnicoId && String(tecnicoId).trim()) {
      data.tecnicoId = String(tecnicoId).trim();
    } else {
      data.tecnicoId = null;
    }
    const intervention = await prisma.intervention.create({
      data,
      include: {
        client: { select: { ragioneSociale: true } },
        location: { select: { nomeSede: true } },
        tipoIntervento: { select: { nome: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Intervento creato',
      data: intervention
    });
  } catch (error) {
    console.error('Create intervention error:', error);
    const msg = error.code === 'P2003' ? 'Cliente, sede o tipo intervento non validi' : (error.message || 'Errore nella creazione');
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /api/interventions/:id/check-in (tecnico)
router.post('/:id/check-in', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const tecnicoId = req.user.id;

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!intervention) {
      return res.status(404).json({ success: false, message: 'Intervento non trovato' });
    }

    if (intervention.tecnicoId !== tecnicoId) {
      return res.status(403).json({ success: false, message: 'Non assegnato a te' });
    }

    // Verify distance if location has coordinates
    if (intervention.location?.latitudine && intervention.location?.longitudine) {
      const distance = haversineDistance(
        parseFloat(lat),
        parseFloat(lng),
        intervention.location.latitudine,
        intervention.location.longitudine
      );

      if (distance > 0.5) { // 500 meters
        return res.status(400).json({
          success: false,
          message: `Troppo lontano (${distance.toFixed(2)} km). Avvicinati alla sede.`
        });
      }
    }

    const updated = await prisma.intervention.update({
      where: { id },
      data: {
        stato: 'in_corso',
        checkInLat: parseFloat(lat),
        checkInLng: parseFloat(lng),
        checkInTime: new Date()
      }
    });

    res.json({ success: true, message: 'Check-in effettuato', data: updated });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Errore check-in' });
  }
});

// POST /api/interventions/:id/complete (tecnico) - richiede firma in loco (firmaTecnicoUrl)
router.post('/:id/complete', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id } = req.params;
    const { noteTecnico, risultato, firmaTecnicoUrl, firmaClienteUrl } = req.body;

    if (!firmaTecnicoUrl || !firmaTecnicoUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Firma in loco obbligatoria per chiudere l\'intervento. Firma prima di completare.'
      });
    }

    const intervention = await prisma.intervention.findUnique({ where: { id } });

    if (!intervention || intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }

    const dataEsecuzione = new Date();
    const updated = await prisma.intervention.update({
      where: { id },
      data: {
        stato: 'completato',
        dataEsecuzione,
        checkOutTime: dataEsecuzione,
        noteTecnico: noteTecnico || null,
        risultato: risultato || null,
        firmaTecnicoUrl: firmaTecnicoUrl.trim(),
        firmaClienteUrl: firmaClienteUrl && firmaClienteUrl.trim() ? firmaClienteUrl.trim() : null
      }
    });

    // Genera PDF report e assegna al cliente (scaricabile da registrazioni cliente)
    let reportPdfUrl = null;
    let reportErrore = null;
    try {
      const full = await prisma.intervention.findUnique({
        where: { id },
        include: {
          client: true,
          location: true,
          tecnico: { select: { nome: true, cognome: true } },
          tipoIntervento: true,
          prodotti: { include: { prodotto: true } },
          foto: true
        }
      });
      if (!full) {
        reportErrore = 'Intervento non trovato dopo update';
      } else {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        const uploadRootDir = path.isAbsolute(uploadPath) ? uploadPath : path.join(__dirname, '..', '..', uploadPath);
        reportPdfUrl = await saveInterventionReport(full, uploadRootDir);
        await prisma.intervention.update({
          where: { id },
          data: { reportPdfUrl }
        });
        await prisma.documentoCliente.create({
          data: {
            clientId: updated.clientId,
            url: reportPdfUrl,
            nome: `Report intervento ${dataEsecuzione.toLocaleDateString('it-IT')} ${dataEsecuzione.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${full.tipoIntervento?.nome || 'Intervento'}`,
            tipo: 'report',
            dataDocumento: dataEsecuzione
          }
        });
      }
    } catch (pdfErr) {
      reportErrore = pdfErr.message || String(pdfErr);
      console.error('Errore generazione PDF report:', pdfErr);
      if (pdfErr.stack) console.error(pdfErr.stack);
    }

    const updatedWithReport = await prisma.intervention.findUnique({
      where: { id },
      include: {
        client: { select: { ragioneSociale: true } },
        location: { select: { nomeSede: true } },
        tipoIntervento: { select: { nome: true } }
      }
    });

    const msg = reportPdfUrl
      ? 'Intervento completato. Report PDF generato e assegnato al cliente.'
      : (reportErrore ? 'Intervento completato. Report non generato (errore tecnico: ' + reportErrore + '). Puoi rigenerarlo dalla scheda intervento.' : 'Intervento completato.');
    res.json({
      success: true,
      message: msg,
      reportGenerato: !!reportPdfUrl,
      reportPdfUrl: reportPdfUrl || undefined,
      data: updatedWithReport
    });
  } catch (error) {
    console.error('Complete intervention error:', error);
    res.status(500).json({ success: false, message: 'Errore completamento' });
  }
});

// POST /api/interventions/:id/rigenera-report (admin) - Rigenera il PDF report per un intervento già completato
router.post('/:id/rigenera-report', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const full = await prisma.intervention.findUnique({
      where: { id },
      include: {
        client: true,
        location: true,
        tecnico: { select: { nome: true, cognome: true } },
        tipoIntervento: true,
        prodotti: { include: { prodotto: true } },
        foto: true
      }
    });
    if (!full) return res.status(404).json({ success: false, message: 'Intervento non trovato' });
    if (full.stato !== 'completato') {
      return res.status(400).json({ success: false, message: 'Solo gli interventi completati possono avere il report rigenerato.' });
    }

    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const uploadRootDir = path.isAbsolute(uploadPath) ? uploadPath : path.join(__dirname, '..', '..', uploadPath);
    const reportPdfUrl = await saveInterventionReport(full, uploadRootDir);

    await prisma.intervention.update({
      where: { id },
      data: { reportPdfUrl }
    });

    const dataEsecuzione = full.dataEsecuzione ? new Date(full.dataEsecuzione) : new Date();
    const nomeReport = `Report intervento ${dataEsecuzione.toLocaleDateString('it-IT')} ${dataEsecuzione.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${full.tipoIntervento?.nome || 'Intervento'}`;

    const esistente = await prisma.documentoCliente.findFirst({
      where: { clientId: full.clientId, tipo: 'report', url: reportPdfUrl }
    });
    if (esistente) {
      await prisma.documentoCliente.update({
        where: { id: esistente.id },
        data: { nome: nomeReport, dataDocumento: dataEsecuzione }
      });
    } else {
      await prisma.documentoCliente.create({
        data: {
          clientId: full.clientId,
          url: reportPdfUrl,
          nome: nomeReport,
          tipo: 'report',
          dataDocumento: dataEsecuzione
        }
      });
    }

    res.json({ success: true, message: 'Report PDF rigenerato e assegnato al cliente.', reportPdfUrl });
  } catch (error) {
    console.error('Rigenera report error:', error);
    res.status(500).json({ success: false, message: error.message || 'Errore durante la rigenerazione del report' });
  }
});

// POST /api/interventions/:id/prodotti - Aggiungi prodotto all'intervento (scarico da magazzino)
router.post('/:id/prodotti', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id } = req.params;
    const { prodottoId, quantitaUsata, note } = req.body;

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: { prodotti: { include: { prodotto: true } } }
    });
    if (!intervention || intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }
    if (intervention.stato === 'completato') {
      return res.status(400).json({ success: false, message: 'Intervento già chiuso' });
    }

    const qty = parseFloat(quantitaUsata);
    if (!prodottoId || !(qty > 0)) {
      return res.status(400).json({ success: false, message: 'prodottoId e quantitaUsata (maggiore di 0) obbligatori' });
    }

    const prodotto = await prisma.prodotto.findUnique({ where: { id: prodottoId } });
    if (!prodotto) {
      return res.status(404).json({ success: false, message: 'Prodotto non trovato' });
    }
    if (prodotto.quantitaDisponibile < qty) {
      return res.status(400).json({
        success: false,
        message: `Giacenza insufficiente. Disponibili: ${prodotto.quantitaDisponibile} ${prodotto.unitaMisura}`
      });
    }

    await prisma.$transaction([
      prisma.prodottoUtilizzato.create({
        data: {
          interventionId: id,
          prodottoId,
          quantitaUsata: qty,
          unitaMisura: prodotto.unitaMisura,
          note: note || null
        }
      }),
      prisma.prodotto.update({
        where: { id: prodottoId },
        data: { quantitaDisponibile: { decrement: qty } }
      })
    ]);

    const updated = await prisma.intervention.findUnique({
      where: { id },
      include: {
        client: true,
        location: true,
        tecnico: { select: { id: true, nome: true, cognome: true, telefono: true } },
        tipoIntervento: true,
        foto: true,
        prodotti: { include: { prodotto: true } }
      }
    });
    res.json({ success: true, message: 'Prodotto aggiunto e scaricato da magazzino', data: updated });
  } catch (error) {
    console.error('Add product to intervention error:', error);
    res.status(500).json({ success: false, message: 'Errore aggiunta prodotto' });
  }
});

// DELETE /api/interventions/:id/prodotti/:rigaId - Rimuovi prodotto (rientro in magazzino, solo se intervento non chiuso)
router.delete('/:id/prodotti/:rigaId', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id, rigaId } = req.params;

    const intervention = await prisma.intervention.findUnique({ where: { id } });
    if (!intervention || intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }
    if (intervention.stato === 'completato') {
      return res.status(400).json({ success: false, message: 'Intervento già chiuso' });
    }

    const riga = await prisma.prodottoUtilizzato.findFirst({
      where: { id: rigaId, interventionId: id },
      include: { prodotto: true }
    });
    if (!riga) {
      return res.status(404).json({ success: false, message: 'Riga non trovata' });
    }

    await prisma.$transaction([
      prisma.prodottoUtilizzato.delete({ where: { id: rigaId } }),
      prisma.prodotto.update({
        where: { id: riga.prodottoId },
        data: { quantitaDisponibile: { increment: riga.quantitaUsata } }
      })
    ]);

    const updated = await prisma.intervention.findUnique({
      where: { id },
      include: {
        prodotti: { include: { prodotto: true } }
      }
    });
    res.json({ success: true, message: 'Prodotto rimosso e rientrato in magazzino', data: updated });
  } catch (error) {
    console.error('Remove product error:', error);
    res.status(500).json({ success: false, message: 'Errore rimozione prodotto' });
  }
});

// POST /api/interventions/:id/firma-tecnico - Salva firma tecnico (in loco)
router.post('/:id/firma-tecnico', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id } = req.params;
    const { firmaUrl } = req.body;
    if (!firmaUrl || !firmaUrl.trim()) {
      return res.status(400).json({ success: false, message: 'firmaUrl obbligatorio' });
    }
    const intervention = await prisma.intervention.findUnique({ where: { id } });
    if (!intervention || intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }
    const updated = await prisma.intervention.update({
      where: { id },
      data: { firmaTecnicoUrl: firmaUrl.trim() }
    });
    res.json({ success: true, message: 'Firma tecnico salvata', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore salvataggio firma' });
  }
});

// POST /api/interventions/:id/firma-cliente - Salva firma cliente (opzionale)
router.post('/:id/firma-cliente', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id } = req.params;
    const { firmaUrl } = req.body;
    if (!firmaUrl || !firmaUrl.trim()) {
      return res.status(400).json({ success: false, message: 'firmaUrl obbligatorio' });
    }
    const intervention = await prisma.intervention.findUnique({ where: { id } });
    if (!intervention || intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }
    const updated = await prisma.intervention.update({
      where: { id },
      data: { firmaClienteUrl: firmaUrl.trim() }
    });
    res.json({ success: true, message: 'Firma cliente salvata', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore salvataggio firma' });
  }
});

module.exports = router;

// GET /api/interventions/:id/download-report - Scarica il PDF del report
router.get('/:id/download-report', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: { client: { select: { ragioneSociale: true } } }
    });
    
    if (!intervention) {
      return res.status(404).json({ success: false, message: 'Intervento non trovato' });
    }
    
    // Verifica permessi
    if (req.user.ruolo === 'tecnico' && intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }
    
    if (!intervention.reportPdfUrl) {
      return res.status(404).json({ success: false, message: 'Report non ancora generato per questo intervento' });
    }
    
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const uploadRootDir = path.isAbsolute(uploadPath) ? uploadPath : path.join(__dirname, '..', '..', uploadPath);
    const filePath = path.join(uploadRootDir, intervention.reportPdfUrl.replace('/uploads/', ''));
    
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File PDF non trovato sul server' });
    }
    
    const clientName = (intervention.client?.ragioneSociale || 'cliente').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `report_intervento_${clientName}_${id}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ success: false, message: 'Errore nel download del report' });
  }
});

// ============================================
// NUOVE API AGGIUNTE
// ============================================

// POST /api/interventions/:id/foto - Aggiungi foto all'intervento (tecnico)
router.post('/:id/foto', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id } = req.params;
    const { fotoUrl, tipo = 'durante', descrizione } = req.body;

    if (!fotoUrl || !fotoUrl.trim()) {
      return res.status(400).json({ success: false, message: 'URL foto obbligatorio' });
    }

    const intervention = await prisma.intervention.findUnique({ where: { id } });
    if (!intervention || intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }

    if (intervention.stato === 'completato') {
      return res.status(400).json({ success: false, message: 'Intervento già chiuso' });
    }

    const foto = await prisma.fotoIntervento.create({
      data: {
        interventionId: id,
        fotoUrl: fotoUrl.trim(),
        tipo,
        descrizione: descrizione || null
      }
    });

    res.status(201).json({ success: true, message: 'Foto aggiunta', data: foto });
  } catch (error) {
    console.error('Add foto error:', error);
    res.status(500).json({ success: false, message: 'Errore aggiunta foto' });
  }
});

// DELETE /api/interventions/:id/foto/:fotoId - Elimina foto (tecnico)
router.delete('/:id/foto/:fotoId', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id, fotoId } = req.params;

    const intervention = await prisma.intervention.findUnique({ where: { id } });
    if (!intervention || intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }

    if (intervention.stato === 'completato') {
      return res.status(400).json({ success: false, message: 'Intervento già chiuso' });
    }

    await prisma.fotoIntervento.deleteMany({
      where: { id: fotoId, interventionId: id }
    });

    res.json({ success: true, message: 'Foto eliminata' });
  } catch (error) {
    console.error('Delete foto error:', error);
    res.status(500).json({ success: false, message: 'Errore eliminazione foto' });
  }
});

// PUT /api/interventions/:id - Modifica intervento (admin)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      dataProgrammata, 
      tecnicoId, 
      tipoInterventoId, 
      noteInterne,
      stato 
    } = req.body;

    const data = {};
    if (dataProgrammata) data.dataProgrammata = new Date(dataProgrammata);
    if (tecnicoId) data.tecnicoId = tecnicoId;
    if (tipoInterventoId) data.tipoInterventoId = tipoInterventoId;
    if (noteInterne !== undefined) data.noteInterne = noteInterne;
    if (stato && ['pianificato', 'in_corso', 'completato', 'annullato'].includes(stato)) {
      data.stato = stato;
    }

    const updated = await prisma.intervention.update({
      where: { id },
      data,
      include: {
        client: { select: { ragioneSociale: true } },
        location: { select: { nomeSede: true } },
        tecnico: { select: { nome: true, cognome: true } },
        tipoIntervento: { select: { nome: true } }
      }
    });

    res.json({ success: true, message: 'Intervento aggiornato', data: updated });
  } catch (error) {
    console.error('Update intervention error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Intervento non trovato' });
    }
    res.status(500).json({ success: false, message: 'Errore aggiornamento' });
  }
});

// DELETE /api/interventions/:id - Elimina intervento (admin)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.intervention.delete({ where: { id } });

    res.json({ success: true, message: 'Intervento eliminato' });
  } catch (error) {
    console.error('Delete intervention error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Intervento non trovato' });
    }
    res.status(500).json({ success: false, message: 'Errore eliminazione' });
  }
});

// ============================================
// SOPRALLUOGHI - API per formulari
// ============================================

// POST /api/interventions/:id/sopralluogo - Salva dati formulario sopraluogo (tecnico)
router.post('/:id/sopralluogo', authMiddleware, requireTecnico, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoSopralluogo, dati } = req.body;

    if (!tipoSopralluogo || !['zanzare', 'ratti', 'blatte'].includes(tipoSopralluogo)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo sopralluogo non valido. Usa: zanzare, ratti, blatte' 
      });
    }

    if (!dati || typeof dati !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: 'Dati sopralluogo obbligatori' 
      });
    }

    const intervention = await prisma.intervention.findUnique({ where: { id } });
    if (!intervention || intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }

    // Salva i dati del sopraluogo
    const updated = await prisma.intervention.update({
      where: { id },
      data: {
        sopralluogoData: {
          tipo: tipoSopralluogo,
          ...dati,
          completatoAt: new Date().toISOString()
        }
      },
      include: {
        client: { select: { ragioneSociale: true } },
        location: { select: { nomeSede: true } },
        tipoIntervento: { select: { nome: true } }
      }
    });

    res.json({ 
      success: true, 
      message: 'Sopralluogo completato e salvato',
      data: updated
    });
  } catch (error) {
    console.error('Save sopralluogo error:', error);
    res.status(500).json({ success: false, message: 'Errore salvataggio sopralluogo' });
  }
});

// GET /api/interventions/:id/sopralluogo - Recupera dati formulario (tecnico/admin)
router.get('/:id/sopralluogo', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        sopralluogoData: true,
        stato: true,
        client: { select: { ragioneSociale: true } },
        location: { select: { nomeSede: true } },
        tecnico: { select: { nome: true, cognome: true } }
      }
    });

    if (!intervention) {
      return res.status(404).json({ success: false, message: 'Intervento non trovato' });
    }

    // Check permission
    if (req.user.ruolo === 'tecnico' && intervention.tecnicoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorizzato' });
    }

    if (!intervention.sopralluogoData) {
      return res.status(404).json({ success: false, message: 'Sopralluogo non ancora completato' });
    }

    res.json({ success: true, data: intervention.sopralluogoData });
  } catch (error) {
    console.error('Get sopralluogo error:', error);
    res.status(500).json({ success: false, message: 'Errore recupero dati' });
  }
});
