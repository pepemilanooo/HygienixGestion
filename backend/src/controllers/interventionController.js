const Intervention = require('../models/Intervention');
const Location = require('../models/Location');
const { query } = require('../config/database');
const { generateInterventionReport, saveReportToClientFile } = require('../services/interventionReportPdf');
const path = require('path');

const interventionController = {
  getAll: async (req, res, next) => {
    try {
      const {
        clientId,
        technicianId,
        status,
        fromDate,
        toDate,
        page = 1,
        limit = 50
      } = req.query;

      const offset = (page - 1) * limit;

      // Filter by technician if user is technician
      let effectiveTechnicianId = technicianId;
      if (req.user.ruolo === 'tecnico' && !technicianId) {
        effectiveTechnicianId = req.user.id;
      }

      const interventions = await Intervention.findAll({
        clientId,
        technicianId: effectiveTechnicianId,
        status,
        fromDate,
        toDate,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const stats = await Intervention.getStats(
        req.user.ruolo === 'tecnico' ? req.user.id : null
      );

      res.json({
        success: true,
        data: interventions,
        meta: {
          total: parseInt(stats.totali),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const intervention = await Intervention.findById(id);

      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervento non trovato'
        });
      }

      // Check if technician can access this intervention
      if (req.user.ruolo === 'tecnico' && intervention.technician_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato a visualizzare questo intervento'
        });
      }

      // Get photos and product usage
      const photos = await Intervention.getPhotos(id);
      const productUsage = await Intervention.getProductUsage(id);

      res.json({
        success: true,
        data: {
          ...intervention,
          foto: photos,
          prodotti_usati: productUsage
        }
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const intervention = await Intervention.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Intervento creato con successo',
        data: intervention
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Check if technician can update this intervention
      if (req.user.ruolo === 'tecnico') {
        const existing = await Intervention.findById(id);
        if (!existing || existing.technician_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Non autorizzato a modificare questo intervento'
          });
        }
      }

      const intervention = await Intervention.update(id, req.body);

      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervento non trovato'
        });
      }

      res.json({
        success: true,
        message: 'Intervento aggiornato con successo',
        data: intervention
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await Intervention.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Intervento non trovato'
        });
      }

      res.json({
        success: true,
        message: 'Intervento eliminato con successo'
      });
    } catch (error) {
      next(error);
    }
  },

  checkIn: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;
      const technicianId = req.user.id;

      // Get intervention and location
      const intervention = await Intervention.findById(id);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervento non trovato'
        });
      }

      if (intervention.technician_id !== technicianId) {
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato'
        });
      }

      // Calculate distance from location
      const location = await Location.findById(intervention.location_id);
      if (location && location.latitudine && location.longitudine) {
        const distance = Location.calculateDistance(
          parseFloat(lat), parseFloat(lng),
          parseFloat(location.latitudine), parseFloat(location.longitudine)
        );

        if (distance > 0.5) { // 500 meters
          return res.status(400).json({
            success: false,
            message: `Troppo lontano dalla sede (${distance.toFixed(2)} km). Avvicinati alla sede per fare check-in.`
          });
        }
      }

      // Update intervention
      const updated = await Intervention.update(id, {
        stato: 'in_corso',
        check_in_lat: lat,
        check_in_lng: lng,
        check_in_time: new Date()
      });

      res.json({
        success: true,
        message: 'Check-in effettuato con successo',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  checkOut: async (req, res, next) => {
    try {
      const { id } = req.params;
      const technicianId = req.user.id;

      const intervention = await Intervention.findById(id);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervento non trovato'
        });
      }

      if (intervention.technician_id !== technicianId) {
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato'
        });
      }

      const updated = await Intervention.update(id, {
        stato: 'completato',
        data_esecuzione: new Date(),
        check_out_time: new Date()
      });

      res.json({
        success: true,
        message: 'Check-out effettuato con successo',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  addPhoto: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { photoUrl, type = 'durante', description } = req.body;

      const photo = await Intervention.addPhoto(id, photoUrl, type, description);

      res.status(201).json({
        success: true,
        message: 'Foto aggiunta con successo',
        data: photo
      });
    } catch (error) {
      next(error);
    }
  },

  addProductUsage: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { productId, quantity, unit, notes } = req.body;

      // Add product usage
      const usage = await Intervention.addProductUsage(id, productId, quantity, unit, notes);

      // Update product stock
      await require('./Product').updateStock(productId, -quantity);

      res.status(201).json({
        success: true,
        message: 'Prodotto registrato con successo',
        data: usage
      });
    } catch (error) {
      next(error);
    }
  },

  saveSignature: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { signatureUrl } = req.body;

      const updated = await Intervention.update(id, {
        firma_cliente_url: signatureUrl
      });

      res.json({
        success: true,
        message: 'Firma salvata con successo',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  complete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { note, temperatura, umidita } = req.body;

      const updated = await Intervention.update(id, {
        stato: 'completato',
        data_esecuzione: new Date(),
        check_out_time: new Date(),
        note_tecnico: note,
        temperatura,
        umidita
      });

      res.json({
        success: true,
        message: 'Intervento completato con successo',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  getReport: async (req, res, next) => {
    try {
      const { id } = req.params;
      const intervention = await Intervention.findById(id);

      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervento non trovato'
        });
      }

      const photos = await Intervention.getPhotos(id);
      const productUsage = await Intervention.getProductUsage(id);

      res.json({
        success: true,
        data: {
          ...intervention,
          foto: photos,
          prodotti_usati: productUsage
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Genera e restituisce il report PDF dell'intervento
   * POST /api/interventions/:id/generate-report
   */
  generateAndDownloadReport: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { saveToClientFile = true } = req.body;

      // Recupera l'intervento completo con tutti i dettagli
      const intervention = await Intervention.findById(id);
      
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervento non trovato'
        });
      }

      // Verifica che l'intervento sia completato
      if (intervention.stato !== 'completato') {
        return res.status(400).json({
          success: false,
          message: 'L\'intervento deve essere completato prima di generare il report'
        });
      }

      // Recupera foto e prodotti
      const photos = await Intervention.getPhotos(id);
      const products = await Intervention.getProductUsage(id);

      // Prepara i dati completi per il PDF
      const interventionData = {
        ...intervention,
        foto: photos,
        prodotti: products
      };

      // Directory uploads
      const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

      // Genera il PDF
      const reportResult = await generateInterventionReport(interventionData, uploadDir);

      // Salva il riferimento nel database (report_pdf_url)
      await Intervention.update(id, { report_pdf_url: reportResult.filePath });

      // Salva anche nella ficha del cliente come documento (opzionale)
      if (saveToClientFile) {
        try {
          await saveReportToClientFile(intervention.client_id, reportResult.filePath, id);
        } catch (saveError) {
          console.error('Errore salvataggio nella ficha cliente:', saveError);
          // Non bloccare il download se il salvataggio fallisce
        }
      }

      // Restituisci il file PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report_intervento_${id}.pdf"`);
      res.sendFile(reportResult.fullPath, (err) => {
        if (err) {
          console.error('Errore invio file:', err);
          // Se l'invio fallisce, almeno restituisci il percorso
          if (!res.headersSent) {
            res.json({
              success: true,
              message: 'Report generato ma errore nel download',
              data: {
                reportUrl: reportResult.filePath,
                fileName: reportResult.fileName
              }
            });
          }
        }
      });

    } catch (error) {
      console.error('Errore generazione report:', error);
      next(error);
    }
  },

  /**
   * Ottiene l'URL del report PDF generato
   * GET /api/interventions/:id/report
   */
  getReportUrl: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const intervention = await Intervention.findById(id);
      
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervento non trovato'
        });
      }

      // Verifica se esiste un report
      if (!intervention.report_pdf_url) {
        return res.status(404).json({
          success: false,
          message: 'Report non ancora generato per questo intervento'
        });
      }

      res.json({
        success: true,
        data: {
          reportUrl: intervention.report_pdf_url,
          generatedAt: intervention.data_aggiornamento || intervention.updated_at
        }
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = interventionController;
