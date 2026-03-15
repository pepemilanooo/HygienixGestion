const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e password sono obbligatori'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.attivo) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { ultimoAccesso: new Date() }
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login effettuato',
      data: {
        user: userWithoutPassword,
        tokens: { accessToken, refreshToken }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const message = process.env.NODE_ENV === 'production'
      ? 'Errore durante il login'
      : (error.message || 'Errore durante il login');
    res.status(500).json({
      success: false,
      message
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token mancante'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokens = generateTokens(decoded.userId);

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token non valido'
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logout effettuato'
  });
});

// PUT /api/auth/me/password - Cambia password utente loggato
router.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const { passwordAttuale, nuovaPassword } = req.body;
    if (!passwordAttuale || !nuovaPassword) {
      return res.status(400).json({ success: false, message: 'Password attuale e nuova password sono obbligatorie' });
    }
    if (nuovaPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La nuova password deve essere di almeno 6 caratteri' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
    const isValid = await bcrypt.compare(passwordAttuale, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Password attuale non corretta' });
    }
    const hash = await bcrypt.hash(nuovaPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hash }
    });
    res.json({ success: true, message: 'Password aggiornata' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Errore aggiornamento password' });
  }
});

module.exports = router;
