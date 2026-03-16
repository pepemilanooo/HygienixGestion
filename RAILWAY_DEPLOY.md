# Deploy su Railway - Istruzioni

## 1. Database Migration (Eseguire sulla shell di Railway)

Accedi al servizio backend su Railway, vai nella shell e esegui:

```bash
npx prisma migrate deploy
```

Oppure se vuoi ricreare il database (ATTENZIONE: perde i dati):
```bash
npx prisma migrate reset --force
```

## 2. Verifica Deploy Frontend

Il frontend viene deployato automaticamente da Railway quando fai push su GitHub.
Verifica che il build sia ok nella dashboard di Railway.

## 3. Verifica Deploy Backend

Il backend viene deployato automaticamente. Verifica i log in caso di errori.

## 4. Test Sopralluoghi

Dopo il deploy, testa:
1. Apri un intervento come tecnico
2. Clicca su uno dei 3 pulsanti (Zanzare, Ratti, Blatte)
3. Compila il form e salva
4. Verifica che i dati siano salvati correttamente
