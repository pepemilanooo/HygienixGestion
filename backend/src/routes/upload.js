const express = require('express');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/upload/foto
router.post('/foto', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Nessun file caricato' });
  }

  const url = `/uploads/photos/${req.file.filename}`;
  res.json({
    success: true,
    data: {
      url,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    }
  });
});

// POST /api/upload/firma
router.post('/firma', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Nessun file caricato' });
  }

  const url = `/uploads/signatures/${req.file.filename}`;
  res.json({
    success: true,
    data: { url, filename: req.file.filename }
  });
});

// POST /api/upload/documento
router.post('/documento', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Nessun file caricato' });
  }

  const url = `/uploads/documents/${req.file.filename}`;
  res.json({
    success: true,
    data: {
      url,
      filename: req.file.filename,
      originalname: req.file.originalname
    }
  });
});

module.exports = router;
