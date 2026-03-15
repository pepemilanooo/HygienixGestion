# 🚀 GUIDA DEFINITIVA - Deploy Hygienix su Railway

## Step-by-Step: Dalla A alla Z, senza errori

---

## 📋 PREREQUISITI

Prima di iniziare, assicurati di avere:

1. **Account Railway**: https://railway.app (gratuito, con $5 crediti iniziali)
2. **Account GitHub**: https://github.com (per ospitare il codice)
3. **Git** installato sul tuo PC: `git --version` deve funzionare
4. **Node.js** v18+: `node --version` deve mostrare v18.x o superiore

---

## 🗂️ STEP 1: PREPARA I FILE (10 minuti)

### 1.1 Estrai il progetto

```bash
# Estrai lo zip in una cartella
cd /cartella/dove/hai/scaricato
unzip hygienix-saas-complete.zip -d hygienix-saas
cd hygienix-saas
```

### 1.2 Crea il file .env per il backend

Copia l'esempio e modificalo:

```bash
cd backend
cp .env.example .env
```

Modifica `.env` con un editor:

```env
# PER RAILWAY - OBBLIGATORIO USARE /data
DATABASE_URL="file:/data/dev.db"

# JWT Segreti - CAMBIA QUESTI VALORI!
JWT_SECRET="il-tuo-super-segreto-jwt-2024"
JWT_REFRESH_SECRET="il-tuo-refresh-segreto-2024"
JWT_EXPIRES_IN="24h"

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://TUO-FRONTEND-URL.up.railway.app"

# Email (opzionale, per promemoria)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

# Upload
UPLOAD_PATH="/data/uploads"
MAX_FILE_SIZE="10485760"
```

⚠️ **IMPORTANTE**: `/data` è OBBLIGATORIO su Railway per la persistenza!

### 1.3 Crea .gitignore

Crea file `backend/.gitignore`:

```gitignore
node_modules
.env
*.db
*.sqlite
*.sqlite3
uploads
/data
```

Crea file `frontend/.gitignore`:

```gitignore
node_modules
dist
.env
.env.local
```

---

## 🔧 STEP 2: TESTA IN LOCALE (5 minuti)

### 2.1 Installa dipendenze backend

```bash
cd backend
npm install
```

### 2.2 Crea database locale

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 2.3 Avvia backend locale

```bash
npm run dev
```

Dovresti vedere:
```
🚀 Hygienix Backend running on port 3001
📡 Environment: development
💾 Database: file:./dev.db
```

Testa: http://localhost:3001/api/health

Dovresti vedere:
```json
{ "status": "OK", "database": "connected" }
```

### 2.4 Installa e testa frontend

In un NUOVO terminale:

```bash
cd frontend
npm install
npm run dev
```

Vai su http://localhost:5173 e prova a fare login con:
- **Admin**: admin@hygienix.it / admin123
- **Tecnico**: tecnico@hygienix.it / tecnico123

---

## 📦 STEP 3: COMMIT SU GITHUB (5 minuti)

### 3.1 Inizializza repository

```bash
# Dalla root del progetto (hygienix-saas/)
git init
git add .
git commit -m "Initial commit - Hygienix v1.0"
```

### 3.2 Crea repository su GitHub

1. Vai su https://github.com/new
2. Nome: `hygienix-saas`
3. Private o Public (come preferisci)
4. NON inizializzare con README
5. Clicca "Create repository"

### 3.3 Collega e pusha

```bash
git remote add origin https://github.com/TUO-USERNAME/hygienix-saas.git
git branch -M main
git push -u origin main
```

---

## 🚀 STEP 4: DEPLOY BACKEND SU RAILWAY (10 minuti)

### 4.1 Crea progetto Railway

1. Vai su https://railway.app/dashboard
2. Clicca "New Project"
3. Seleziona "Deploy from GitHub repo"
4. Clicca "Configure GitHub App" e autorizza Railway
5. Seleziona il tuo repository `hygienix-saas`
6. Clicca "Add Variables"

### 4.2 Configura variabili d'ambiente

Aggiungi queste variabili NEL BACKEND su Railway:

```
DATABASE_URL = file:/data/dev.db
JWT_SECRET = il-tuo-super-segreto-jwt-2024
JWT_REFRESH_SECRET = il-tuo-refresh-segreto-2024
JWT_EXPIRES_IN = 24h
NODE_ENV = production
FRONTEND_URL = (lascia vuoto per ora)
UPLOAD_PATH = /data/uploads
MAX_FILE_SIZE = 10485760
```

### 4.3 Configura Volume (FONDAMENTALE!)

Questo è lo STEP CRITICO per non perdere i dati:

1. Nella dashboard del progetto, clicca su "New"
2. Seleziona "Add Volume"
3. Mount Path: `/data`
4. Clicca "Create"

⚠️ **Senza questo volume, i dati si perdono ad ogni deploy!**

### 4.4 Configura Build Settings

1. Nel servizio backend, vai su "Settings"
2. Root Directory: `backend`
3. Build Command: `npm install && npx prisma generate`
4. Start Command: `npx prisma migrate deploy && npm start`
5. Healthcheck Path: `/api/health`

### 4.5 Deploy

1. Clicca "Deploy"
2. Attendi che il deploy finisca (vedi i log)
3. Quando vedi "🚀 Hygienix Backend running", copia l'URL generato

L'URL sarà tipo: `https://hygienix-saas-production.up.railway.app`

### 4.6 Testa il backend

Apri nel browser:
```
https://TUO-URL.up.railway.app/api/health
```

Devi vedere:
```json
{ "status": "OK", "database": "connected" }
```

---

## 🎨 STEP 5: DEPLOY FRONTEND SU RAILWAY (10 minuti)

### 5.1 Aggiorna API URL nel frontend

Modifica `frontend/.env.production` (crea il file se non esiste):

```env
VITE_API_URL=https://TUO-BACKEND-URL.up.railway.app/api
```

Modifica `frontend/vite.config.js` per il build:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
```

### 5.2 Commit delle modifiche

```bash
git add .
git commit -m "Update API URL for production"
git push
```

### 5.3 Crea nuovo servizio frontend

1. Nella dashboard Railway, clicca "New"
2. Seleziona "Deploy from GitHub repo" (stesso repo)
3. Configura:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist -p $PORT`

4. Aggiungi variabile:
   ```
   VITE_API_URL = https://TUO-BACKEND-URL.up.railway.app/api
   ```

5. Clicca "Deploy"

### 5.4 Ottieni URL frontend

Copia l'URL del frontend (es: `https://hygienix-frontend.up.railway.app`)

---

## 🔗 STEP 6: CONNETTI FRONTEND E BACKEND (5 minuti)

### 6.1 Aggiorna CORS nel backend

Torna nel servizio backend su Railway:

1. Vai su "Variables"
2. Aggiorna `FRONTEND_URL` con l'URL del frontend
3. Clicca "Deploy" per rilanciare

### 6.2 Testa tutto

1. Vai all'URL frontend
2. Prova il login con admin@hygienix.it / admin123
3. Verifica che il dashboard carichi

---

## 📱 STEP 7: CONFIGURA MOBILE APP (opzionale)

### 7.1 Aggiorna API URL

Modifica `mobile/src/context/AuthContext.js` e `mobile/src/screens/HomeScreen.js`:

```javascript
const API_URL = 'https://TUO-BACKEND-URL.up.railway.app/api';
```

### 7.2 Build con Expo

```bash
cd mobile
npm install
npx expo start
```

Per build di produzione:
```bash
npx expo build:android  # o :ios
```

---

## ✅ CHECKLIST FINALE

Prima di dichiarare "MISSIONE COMPLETATA", verifica:

- [ ] Backend risponde su `/api/health`
- [ ] Login funziona con credenziali demo
- [ ] Database persistente (aggiungi un cliente, redeploy, verifica che rimanga)
- [ ] Upload funzionano (volume `/data/uploads` configurato)
- [ ] Frontend comunica con backend (CORS ok)
- [ ] Mobile app punta al backend corretto

---

## 🐛 RISOLUZIONE PROBLEMI

### Problema: "Cannot find module '@prisma/client'"
**Soluzione**: Aggiungi `npx prisma generate` nel Build Command

### Problema: "Database is not connected"
**Soluzione**: Verifica che il Volume sia montato su `/data`

### Problema: "CORS error"
**Soluzione**: Verifica che `FRONTEND_URL` nel backend contenga l'URL corretto del frontend

### Problema: File upload non funzionano
**Soluzione**: Verifica che la cartella `/data/uploads` esista e abbia i permessi corretti

### Problema: Dati si perdono dopo deploy
**Soluzione**: CRITICO - Non hai configurato il Volume! Vai a STEP 4.3

---

## 🔐 SICUREZZA POST-DEPLOY

### Cambia le credenziali demo

1. Login come admin
2. Vai in Impostazioni > Utenti
3. Cambia password di admin@hygienix.it
4. Crea nuovi utenti tecnici
5. Disattiva o elimina l'utente demo

### Cambia JWT secrets

1. Vai su Railway > Backend > Variables
2. Modifica `JWT_SECRET` e `JWT_REFRESH_SECRET`
3. Usa password lunghe e casuali
4. Deploy di nuovo

---

## 📞 CONTATTI E SUPPORTO

Se hai problemi:
1. Controlla i log su Railway (molto utili!)
2. Verifica ogni step di questa guida
3. Controlla che le variabili d'ambiente siano corrette

---

## 🎉 CONGRATULAZIONI!

Hygienix è ora online su Railway! 

URL Backend: https://TUO-BACKEND-URL.up.railway.app
URL Frontend: https://TUO-FRONTEND-URL.up.railway.app

Buon lavoro con il tuo gestionale Pest Control! 🐛➡️✨
