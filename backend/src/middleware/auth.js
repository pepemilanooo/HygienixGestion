const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token di autenticazione mancante' 
      });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        ruolo: true,
        telefono: true,
        attivo: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non trovato' 
      });
    }

    if (!user.attivo) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account disattivato' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token scaduto',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token non valido' 
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore di autenticazione' 
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Autenticazione richiesta' 
      });
    }

    if (!roles.includes(req.user.ruolo)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permessi insufficienti' 
      });
    }

    next();
  };
};

const requireAdmin = requireRole('admin', 'operatore');
const requireTecnico = requireRole('tecnico', 'admin', 'operatore');

module.exports = {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireTecnico
};
