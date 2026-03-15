const { uploadFile, getSignedUrl } = require('../config/aws');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato'), false);
    }
  }
});

const uploadController = {
  uploadPhoto: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nessun file caricato'
        });
      }

      const { interventionId, type = 'durante' } = req.body;
      const timestamp = Date.now();
      const key = `photos/${interventionId}/${type}_${timestamp}${path.extname(req.file.originalname)}`;

      const url = await uploadFile(req.file.buffer, key, req.file.mimetype, 'private');

      res.json({
        success: true,
        message: 'Foto caricata con successo',
        data: {
          url,
          key,
          type,
          size: req.file.size
        }
      });
    } catch (error) {
      next(error);
    }
  },

  uploadSignature: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nessun file caricato'
        });
      }

      const { interventionId } = req.body;
      const timestamp = Date.now();
      const key = `signatures/${interventionId}/firma_${timestamp}.png`;

      const url = await uploadFile(req.file.buffer, key, 'image/png', 'private');

      res.json({
        success: true,
        message: 'Firma caricata con successo',
        data: {
          url,
          key
        }
      });
    } catch (error) {
      next(error);
    }
  },

  uploadDocument: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nessun file caricato'
        });
      }

      const { type = 'documents', entityId } = req.body;
      const timestamp = Date.now();
      const key = `${type}/${entityId}/${timestamp}_${req.file.originalname}`;

      const url = await uploadFile(req.file.buffer, key, req.file.mimetype, 'private');

      res.json({
        success: true,
        message: 'Documento caricato con successo',
        data: {
          url,
          key,
          originalName: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getSignedUrl: async (req, res, next) => {
    try {
      const { key } = req.query;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          message: 'Chiave file mancante'
        });
      }

      const url = await getSignedUrl(key, 3600); // 1 hour expiry

      res.json({
        success: true,
        data: {
          url,
          expiresIn: 3600
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Multer middleware
  multerUpload: upload.single('file')
};

module.exports = uploadController;
