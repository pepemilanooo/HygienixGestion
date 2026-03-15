# Deploy Hygienix su Railway

Guida per mettere online backend e frontend su [Railway](https://railway.app).

## Struttura

- **Backend**: Node.js + Express + Prisma (SQLite)
- **Frontend**: Vite + React (build → file statici serviti con `serve`)

Servono **due servizi** su Railway (Backend e Frontend) più un **Volume** per database e upload.

---

## 1. Crea il progetto su Railway

1. Vai su [railway.app](https://railway.app) e accedi (GitHub).
2. **New Project** → **Deploy from GitHub repo** e scegli il repository (oppure **Empty Project** se ancora non hai pushato).
3. Se hai scelto il repo, Railway crea un servizio. **Eliminalo** (Settings → Remove) e procedi con due servizi manuali.

---

## 2. Servizio Backend

1. Nel progetto: **+ New** → **GitHub Repo** (stesso repo) → scegli il repo.
2. Railway crea un servizio. Rinominalo in **Backend** (o `hygienix-api`).
3. **Settings** del servizio Backend:
   - **Root Directory**: `hygienix-saas/backend`  
     (oppure `backend` se il repo è già dentro la cartella hygienix-saas)
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma db push && node src/server.js`  
     (così al primo deploy e ad ogni aggiornamento schema il DB è allineato)
   - **Watch Paths** (opzionale): `backend/**`  
     (così non si ribuilda se cambi solo il frontend)

4. **Variables** (Environment Variables):
   - `NODE_ENV` = `production`
   - `PORT` = (Railway lo imposta da solo, non serve metterlo)
   - `DATABASE_URL` = `file:/data/dev.db`  
     (useremo un volume montato in `/data`)
   - `JWT_SECRET` = una stringa lunga e casuale (es. genera con `openssl rand -base64 32`)
   - `JWT_REFRESH_SECRET` = un’altra stringa casuale
   - `FRONTEND_URL` = **va impostato dopo** aver creato il Frontend (es. `https://tuo-frontend.up.railway.app`)

5. **Volume** (per non perdere DB e file caricati):
   - Nella scheda del servizio Backend: **+ New** → **Volume**.
   - Monta il volume sul path: `/data`
   - Riavvia il servizio dopo aver aggiunto il volume.

6. **Variables** aggiuntive per upload (stesso volume):
   - `UPLOAD_PATH` = `/data/uploads`  
     (i PDF e le firme restano sul volume)

7. Dopo il deploy: **Settings** → **Networking** → **Generate Domain**. Copia l’URL (es. `https://hygienix-backend-production-xxxx.up.railway.app`): ti serve per il frontend.

---

## 3. Servizio Frontend

1. Nel **stesso progetto** Railway: **+ New** → **GitHub Repo** → stesso repository.
2. Rinomina il servizio in **Frontend** (o `hygienix-web`).
3. **Settings** del servizio Frontend:
   - **Root Directory**: `hygienix-saas/frontend`  
     (o `frontend` se il repo è già dentro hygienix-saas)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`  
     (avvia `serve -s dist` e usa la variabile `PORT` di Railway)
   - **Watch Paths** (opzionale): `frontend/**`

4. **Variables**:
   - `VITE_API_URL` = `https://TUO-BACKEND-URL.up.railway.app/api`  
     Sostituisci `TUO-BACKEND-URL` con il dominio generato al passo 2 (es. `https://hygienix-backend-production-xxxx.up.railway.app/api`).  
     **Importante**: in Vite le variabili `VITE_*` vengono “bake” nel build, quindi il valore va messo **prima** del primo build o dopo ogni modifica a questa variabile va rifatto il deploy.

5. **Networking**: **Generate Domain** e copia l’URL del frontend (es. `https://hygienix-frontend-production-xxxx.up.railway.app`).

---

## 4. Collega Backend e Frontend

1. Nel servizio **Backend** → **Variables**:
   - Imposta `FRONTEND_URL` = URL del frontend (es. `https://hygienix-frontend-production-xxxx.up.railway.app`).
   - Così il CORS accetta richieste dal frontend in produzione.

2. Riavvia il Backend (Deploy → Redeploy) dopo aver salvato le variabili.

---

## 5. Primo avvio e seed (utente admin)

- Al primo deploy, con **Start Command** `npx prisma db push && node src/server.js`, il DB viene creato e aggiornato allo schema. Per creare subito admin e tecnico: usa (solo primo deploy) `npx prisma db push && npx prisma db seed && node src/server.js`, poi togli `npx prisma db seed &&`. Credenziali: admin@hygienix.it / admin123, tecnico@hygienix.it / tecnico123.
- (Opzionale) Per eseguire il seed da remoto puoi aggiungere un endpoint temporaneo “seed” protetto da una variabile segreta e chiamalo una volta da browser/Postman, poi rimuovilo.

Se usi il seed da **locale** con SQLite in `backend/dev.db`, in produzione il DB è vuoto fino a quando non crei l’utente dalla tua app (se hai una pagina di registrazione) o non esegui uno seed via script/endpoint.

---

## 6. Riepilogo variabili

| Servizio  | Variabile        | Esempio / Nota                                      |
|-----------|------------------|-----------------------------------------------------|
| Backend   | `DATABASE_URL`   | `file:/data/dev.db`                                |
| Backend   | `UPLOAD_PATH`    | `/data/uploads`                                   |
| Backend   | `JWT_SECRET`     | stringa casuale lunga                              |
| Backend   | `JWT_REFRESH_SECRET` | stringa casuale lunga                          |
| Backend   | `FRONTEND_URL`   | `https://tuo-frontend.up.railway.app`              |
| Frontend  | `VITE_API_URL`   | `https://tuo-backend.up.railway.app/api`           |

---

## 7. Domini e HTTPS

- Railway assegna domini `*.up.railway.app` con HTTPS.
- Puoi aggiungere un **dominio custom** da **Settings** → **Networking** → **Custom Domain** per backend e/o frontend.

---

## 8. Dove si trova il codice

- Backend: cartella `backend` (o `hygienix-saas/backend` se il repo è la root del monorepo).
- Frontend: cartella `frontend` (o `hygienix-saas/frontend`).

Se la root del repository è già `hygienix-saas`, i **Root Directory** sono:
- Backend: `backend`
- Frontend: `frontend`

Se la root del repository è la cartella che contiene solo `backend` e `frontend`, allora:
- Backend: `backend`
- Frontend: `frontend`

Adatta i path in base alla struttura reale del repo su GitHub.

---

Dopo questi passi, l’app sarà online: frontend su un URL e API su un altro, con DB e upload persistenti sul volume.
