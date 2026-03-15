# 🏢 Hygienix - Gestionale Pest Control

Sistema completo di gestione interventi di disinfestazione, derattizzazione e sanificazione.

## 🎯 Caratteristiche

- ✅ **Multi-ruolo**: Admin, Operatore, Tecnico
- ✅ **Calendario interventi**: Vista mensile con planning
- ✅ **GPS Check-in**: Verifica presenza tecnico sul luogo
- ✅ **Firma digitale**: Cliente firma al completamento
- ✅ **Gestione magazzino**: Prodotti e scorte
- ✅ **Reportistica**: PDF interventi e statistiche
- ✅ **Mobile app**: App dedicata per tecnici

## 🏗️ Architettura

```
hygienix-saas/
├── backend/          # Node.js + Express + Prisma + SQLite
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── middleware/ # Auth, upload, validation
│   │   └── prisma/     # Schema database
│   └── uploads/        # File storage
├── frontend/         # React + Vite + Tailwind
│   └── src/
│       ├── pages/      # Dashboard, Clienti, Interventi...
│       └── services/   # API client
└── mobile/           # React Native + Expo
    └── src/
        ├── screens/    # Login, Home, Interventi
        └── navigation/ # Tab navigator
```

## 🚀 Deploy su Railway

Vedi guida completa: [RAILWAY-DEPLOY-GUIDE.md](./RAILWAY-DEPLOY-GUIDE.md)

### Quick Start

```bash
# 1. Clona repository
git clone https://github.com/tuo-username/hygienix-saas.git
cd hygienix-saas

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Frontend (nuovo terminale)
cd frontend
npm install
npm run dev

# 4. Apri http://localhost:5173
# Login: admin@hygienix.it / admin123
```

## 👥 Ruoli e Permessi

| Ruolo | Permessi |
|-------|----------|
| **Admin** | Tutto: clienti, interventi, tecnici, impostazioni |
| **Operatore** | CRUD clienti e interventi, vede report |
| **Tecnico** | Solo propri interventi, check-in GPS, firma |

## 📱 Mobile App

L'app mobile è per i tecnici sul campo:

```bash
cd mobile
npm install
npx expo start
```

Funzionalità:
- Vista interventi del giorno
- Check-in con GPS
- Scatta foto
- Firma digitale cliente
- Completa intervento

## 🔧 Variabili d'Ambiente

### Backend (.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-key"
JWT_REFRESH_SECRET="super-refresh-key"
UPLOAD_PATH="./uploads"
```

### Frontend (.env)

```env
VITE_API_URL="http://localhost:3001/api"
```

## 📁 Database Schema

- **Users**: Admin, operatori, tecnici
- **Clients**: Anagrafica clienti e sedi
- **Interventions**: Interventi programmati/eseguiti
- **Products**: Magazzino prodotti
- **Locations**: Sedi clienti con coordinate GPS

## 🎨 Tecnologie

| Componente | Stack |
|------------|-------|
| Backend | Node.js, Express, Prisma, SQLite |
| Frontend | React, React Router, Tailwind, Vite |
| Mobile | React Native, Expo |
| Auth | JWT, bcrypt |
| Deploy | Railway (con volume persistenza) |

## 📄 Licenza

Progetto privato - Tutti i diritti riservati.

---

**Made with ❤️ for Pest Control Professionals**
