const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function slug(str) {
  return str.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') || 'tecnico';
}

function generaPassword(length = 10) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let p = '';
  for (let i = 0; i < length; i++) p += chars[crypto.randomInt(0, chars.length)];
  return p;
}

async function generaEmailUnivoca(nome, cognome) {
  const base = `${slug(nome)}.${slug(cognome)}`;
  for (let n = 0; n < 20; n++) {
    const suffix = n === 0 ? crypto.randomBytes(3).toString('hex') : `${crypto.randomBytes(2).toString('hex')}${n}`;
    const email = `${base}.${suffix}@hygienix.local`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) return email;
  }
  return `tecnico.${crypto.randomBytes(4).toString('hex')}@hygienix.local`;
}

// GET /api/tecnici (?attivo=true|false per filtrare)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { attivo } = req.query;
    const where = { ruolo: 'tecnico' };
    if (attivo !== undefined) where.attivo = attivo === 'true';

    const tecnici = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        attivo: true,
        createdAt: true,
        ultimoAccesso: true
      },
      orderBy: { cognome: 'asc' }
    });
    res.json({ success: true, data: tecnici });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// POST /api/tecnici - Crea nuovo tecnico (solo admin). Se email/password non forniti, vengono generati automaticamente.
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { nome, cognome, email, password, telefono } = req.body;
    if (!nome?.trim() || !cognome?.trim()) {
      return res.status(400).json({ success: false, message: 'Nome e cognome obbligatori' });
    }
    let emailFinal = email?.trim();
    let passwordFinal = password;
    let generatedPassword = null;
    if (emailFinal && passwordFinal) {
      if (passwordFinal.length < 6) {
        return res.status(400).json({ success: false, message: 'Password almeno 6 caratteri' });
      }
      const existing = await prisma.user.findUnique({ where: { email: emailFinal.toLowerCase() } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email già in uso' });
      }
      emailFinal = emailFinal.toLowerCase();
    } else {
      emailFinal = await generaEmailUnivoca(nome, cognome);
      passwordFinal = generaPassword(10);
      generatedPassword = passwordFinal;
    }
    const hash = await bcrypt.hash(passwordFinal, 10);
    const user = await prisma.user.create({
      data: {
        nome: nome.trim(),
        cognome: cognome.trim(),
        email: emailFinal,
        password: hash,
        telefono: telefono?.trim() || null,
        ruolo: 'tecnico',
        attivo: true
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        attivo: true,
        createdAt: true
      }
    });
    const payload = { ...user };
    if (generatedPassword) payload.generatedPassword = generatedPassword;
    res.status(201).json({ success: true, message: 'Tecnico creato', data: payload });
  } catch (error) {
    console.error('Create tecnico error:', error);
    res.status(500).json({ success: false, message: 'Errore creazione tecnico' });
  }
});

// PATCH /api/tecnici/:id - Aggiorna tecnico (es. disattiva/riattiva)
router.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cognome, telefono, attivo } = req.body;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.ruolo !== 'tecnico') {
      return res.status(404).json({ success: false, message: 'Tecnico non trovato' });
    }
    const data = {};
    if (nome !== undefined) data.nome = nome.trim();
    if (cognome !== undefined) data.cognome = cognome.trim();
    if (telefono !== undefined) data.telefono = telefono?.trim() || null;
    if (attivo !== undefined) data.attivo = !!attivo;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        attivo: true,
        createdAt: true
      }
    });
    res.json({ success: true, message: attivo === false ? 'Tecnico disattivato' : 'Tecnico aggiornato', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore aggiornamento' });
  }
});

// GET /api/tecnici/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const tecnico = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        createdAt: true
      }
    });
    
    if (!tecnico) return res.status(404).json({ success: false, message: 'Non trovato' });
    
    // Get stats
    const stats = await prisma.intervention.groupBy({
      by: ['stato'],
      where: { tecnicoId: req.params.id },
      _count: { stato: true }
    });
    
    res.json({ success: true, data: { ...tecnico, stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// GET /api/tecnici/:id/interventi
router.get('/:id/interventi', authMiddleware, async (req, res) => {
  try {
    // Tecnici vedono solo i propri
    if (req.user.ruolo === 'tecnico' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Accesso negato' });
    }

    const interventi = await prisma.intervention.findMany({
      where: { tecnicoId: req.params.id },
      include: {
        client: { select: { ragioneSociale: true } },
        location: { select: { nomeSede: true } },
        tipoIntervento: { select: { nome: true } }
      },
      orderBy: { dataProgrammata: 'desc' }
    });
    
    res.json({ success: true, data: interventi });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

// GET /api/tecnici/me/oggi - Interventi di oggi per tecnico loggato
router.get('/me/oggi', authMiddleware, async (req, res) => {
  try {
    if (req.user.ruolo !== 'tecnico') {
      return res.status(403).json({ success: false, message: 'Solo per tecnici' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const interventi = await prisma.intervention.findMany({
      where: {
        tecnicoId: req.user.id,
        dataProgrammata: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        client: { select: { ragioneSociale: true } },
        location: { select: { nomeSede: true, indirizzo: true, latitudine: true, longitudine: true } },
        tipoIntervento: { select: { nome: true } }
      },
      orderBy: { dataProgrammata: 'asc' }
    });

    res.json({ success: true, data: interventi });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore' });
  }
});

module.exports = router;
