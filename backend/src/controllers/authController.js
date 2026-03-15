const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e password sono obbligatori'
        });
      }

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenziali non valide'
        });
      }

      if (!user.attivo) {
        return res.status(401).json({
          success: false,
          message: 'Account disattivato'
        });
      }

      const isValidPassword = await User.verifyPassword(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenziali non valide'
        });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      const { accessToken, refreshToken } = generateTokens(user.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login effettuato con successo',
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 3600 // 1 hour
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token mancante'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600
        }
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token non valido o scaduto'
        });
      }
      next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utente non trovato'
        });
      }
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res) => {
    // In a more complex implementation, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logout effettuato con successo'
    });
  }
};

module.exports = authController;
