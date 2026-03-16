# Sopralluoghi - Scaffold Base Completato ✅

## Cosa è stato creato

### 1. Componente Principale: `SopralluogoForm.jsx`
- **Posizione**: `/frontend/src/components/sopralluoghi/SopralluogoForm.jsx`
- **Dimensione**: ~20KB di codice React completo
- **Funzionalità**:
  - Form dinamico per 3 tipi di sopralluogo (zanzare, ratti, blatte)
  - Sezione dati comuni (tipo struttura, condizioni igieniche, orari, giorni)
  - Sezioni specifiche per tipo con tutti i campi dai moduli ODT
  - Gestione stato complessa (nested objects, arrays, checkbox)
  - Salvataggio automatico via API

### 2. API Aggiornate
Aggiunte a `interventionsAPI` in `/frontend/src/services/api.js`:
```javascript
saveSopralluogo: (id, data) => apiClient.post(`/interventions/${id}/sopralluogo`, data),
getSopralluogo: (id) => apiClient.get(`/interventions/${id}/sopralluogo`),
```

### 3. Esempio di Integrazione
File: `SopralluogoIntegrationExample.jsx`
Mostra come integrare il form in `InterventionDetail.jsx` con:
- Selezione tipo sopralluogo
- Visualizzazione form condizionale
- Gestione completamento

### 4. Documentazione
File: `README.md` nella cartella sopralluoghi con:
- Struttura completa dei campi per ogni tipo
- Istruzioni di integrazione
- Note importanti sulla migration
- Guida alla personalizzazione

## Struttura dei Campi per Tipo

### ZANZARE
**Timpestiche:**
- Larvicida
- Adulticida Inverno
- Adulticida Primavera

**Tipo Infestazione:** (Piccola/Media/Alta presenza per ogni timpestica)

**Aree Trattamento:**
- Larvicida: Pozzetti, Cantina, Caldaia, Autoclave, Locale Pompe
- Adulticida: Area Verde, Area Box, Androni

### RATTI
**Tipo Infestazione:**
- Topolino Domestico
- Ratto di Fogna
- Ratto Nero

**Aree (checkbox):**
Black Box, Mini Bait, Cantina, Locale Autoclave, Locale Contatori, Centrale Termica, Area Box, Perimetro Edificio, Locale Pompe, Pozzetti, Isola, Lato Raccolta Rifiuti, Area Verde

### BLATTE
**Tipo Infestazione:**
- Scarafaggio Nero
- Blattella Germanica

**Aree (checkbox):**
Cantina, Locale Autoclave, Locale Contatori, Centrale Termica, LRR, Area Box, Perimetro Edificio, Locale Pompe, Pozzetti, Isola, Perimetro Scale, Fossa Biologica, Lato Raccolta Rifiuti, Punto Acqua

## Prossimi Passi

### 1. Database Migration (IMPORTANTE)
Eseguire su Railway:
```bash
cd backend
npx prisma migrate deploy
```

### 2. Integrazione in InterventionDetail
Aggiungere in `/frontend/src/pages/InterventionDetail.jsx`:

```jsx
import { SopralluogoForm } from '../components/sopralluoghi'

// Nello stato del componente:
const [showSopralluogo, setShowSopralluogo] = useState(false)
const [tipoSopralluogo, setTipoSopralluogo] = useState('')

// Nel render, aggiungere dove appropriato:
{showSopralluogo && (
  <SopralluogoForm 
    interventionId={id}
    tipoSopralluogo={tipoSopralluogo}
    onComplete={() => {
      setShowSopralluogo(false)
      loadIntervention()
    }}
  />
)}
```

### 3. Personalizzazione
Il form è uno **scaffold base** - puoi personalizzare:
- Aggiungere/ rimuovere campi modificando lo stato iniziale
- Cambiare layout modificando i componenti FormZanzare, FormRatti, FormBlatte
- Aggiungere validazione in handleSubmit
- Modificare stili Tailwind

### 4. Test
1. Verificare che il backend risponda correttamente:
   ```
   GET /api/interventions/:id/sopralluogo
   POST /api/interventions/:id/sopralluogo
   ```

2. Testare il form in locale prima del deploy

## File Creati

```
frontend/src/components/sopralluoghi/
├── index.js                           # Export componente
├── SopralluogoForm.jsx               # Componente principale (~20KB)
├── SopralluogoIntegrationExample.jsx # Esempio integrazione
└── README.md                          # Questo file
```

## Supporto

Per modifiche o domande sullo scaffold, consultare:
- I commenti nel codice di SopralluogoForm.jsx
- L'esempio in SopralluogoIntegrationExample.jsx
- La documentazione dei campi in questo README
