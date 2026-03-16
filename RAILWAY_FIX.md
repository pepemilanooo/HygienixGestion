# Fix Railway Deployment

## Problema
Il deployment falliva con errore "Healthcheck failure" perché lo script di start eseguiva `prisma db push` prima di avviare il server.

## Soluzione Applicata

### 1. Modificato package.json
```json
"scripts": {
  "start": "node src/server.js",
  "start:migrate": "npx prisma migrate deploy && node src/server.js",
  "start:push": "npx prisma db push && node src/server.js"
}
```

### 2. Rimosso auto-migration da server.js
- Rimosse le linee che eseguivano `execSync('npx prisma migrate deploy')`
- Il server ora si avvia immediatamente

## Istruzioni per Railway

### Opzione A: Usare Start Command personalizzato (Consigliata)

1. Vai su Railway → Seleziona il servizio Backend
2. Vai nella tab **Settings**
3. Trova la sezione **Start Command**
4. Cambia da `npm start` a:
   ```
   npx prisma migrate deploy && node src/server.js
   ```
5. Clicca **Deploy** per rilanciare

### Opzione B: Variabile d'ambiente

1. Vai su Railway → Seleziona il servizio Backend  
2. Vai nella tab **Variables**
3. Aggiungi una nuova variabile:
   - Name: `RAILWAY_START_COMMAND`
   - Value: `npx prisma migrate deploy && node src/server.js`
4. O modifica direttamente lo Start Command nelle Settings

### Opzione C: Deploy manuale con migration

Se hai accesso alla CLI di Railway:
```bash
railway login
railway connect
# Poi nella shell:
npx prisma migrate deploy
```

## Schema Database

Il campo `sopralluogo_data` deve essere aggiunto alla tabella `interventions`.

Il migration file è già creato in:
```
backend/prisma/migrations/20260316164455_add_sopralluogo_data/migration.sql
```

Contiene:
```sql
ALTER TABLE "interventions" ADD COLUMN "sopralluogo_data" TEXT;
```

## Verifica dopo Deploy

1. Controlla i log su Railway
2. Verifica che l'endpoint `/api/health` risponda:
   ```json
   {"status":"OK","database":"connected"}
   ```
3. Testa il form sopralluoghi nell'applicazione

## Note

- Il frontend è già correttamente deployato
- Il codice è stato pushato su GitHub (commit `e32b863`)
- Il backend ora si avvia senza eseguire migration automatiche