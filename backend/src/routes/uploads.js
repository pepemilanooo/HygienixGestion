const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Upload photo
router.post('/photo',
  uploadController.multerUpload,
  uploadController.uploadPhoto
);

// Upload signature
router.post('/signature',
  uploadController.multerUpload,
  uploadController.uploadSignature
);

// Upload document
router.post('/document',
  uploadController.multerUpload,
  uploadController.uploadDocument
);

// Get signed URL for private files
router.get('/signed-url', uploadController.getSignedUrl);

module.exports = router;
