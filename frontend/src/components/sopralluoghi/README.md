# Componenti Sopralluoghi - Scaffold Base

## File Creati

1. **SopralluogoForm.jsx** - Componente form principale con tutti i campi per i 3 tipi
2. **SopralluogoIntegrationExample.jsx** - Esempio di come integrare il form in InterventionDetail
3. **index.js** - Export del componente

## Struttura del Form

### Dati Comuni (tutti i tipi)
- Tipo Struttura (Palazzo Popolare, Casa di Ringhiera, Palazzo Benestante)
- Condizioni Igieniche (Pessime, Buone, Ottime)
- Locali Commerciali (Bar, Ristorante, Panificio, Altro)
- Orario Preferenziale (Mattina, Pomeriggio)
- Giorni (Lunedì-Sabato)
- Data Sopralluogo
- N° Interventi Annuali
- Mesi Intervento

### Zanzare (campi specifici)
- Timpestiche: Larvicida, Adulticida Inv., Adulticida Primavera
- Tipo Infestazione per ogni timpestica
- Aree Trattamento con Q.tà e Tempistica:
  - Larvicida: Pozzetti, Cantina, Caldaia, Autoclave, Locale Pompe
  - Adulticida: Area Verde, Area Box, Androni

### Ratti (campi specifici)
- Tipo Infestazione: Topolino Domestico, Ratto di Fogna, Ratto Nero
- Aree (checkbox): Black Box, Mini Bait, Cantina, Locale Autoclave, Locale Contatori, Centrale Termica, Area Box, Perimetro Edificio, Locale Pompe, Pozzetti, Isola, Lato Raccolta Rifiuti, Area Verde
- Quantità Prodotto

### Blatte (campi specifici)
- Tipo Infestazione: Scarafaggio Nero, Blattella Germanica
- Aree (checkbox): Cantina, Locale Autoclave, Locale Contatori, Centrale Termica, LRR, Area Box, Perimetro Edificio, Locale Pompe, Pozzetti, Isola, Perimetro Scale, Fossa Biologica, Lato Raccolta Rifiuti, Punto Acqua

## Come Integrare

### Opzione 1: Aggiungere a InterventionDetail.jsx

```jsx
import { SopralluogoForm } from '../components/sopralluoghi'

// Nel componente, aggiungi stato:
const [showSopralluogo, setShowSopralluogo] = useState(false)
const [tipoSopralluogo, setTipoSopralluogo] = useState('')

// Nel render, aggiungi:
{showSopralluogo && (
  <SopralluogoForm 
    interventionId={id}
    tipoSopralluogo={tipoSopralluogo}
    onComplete={() => {
      setShowSopralluogo(false)
      loadIntervention() // ricarica dati
    }}
  />
)}
```

### Opzione 2: Usare SopralluogoIntegrationExample

Copia il codice da `SopralluogoIntegrationExample.jsx` direttamente in InterventionDetail.

## Note Importanti

1. **Database Migration**: Ricordati di eseguire `npx prisma migrate deploy` su Railway
2. **Stato Form**: Il form gestisce automaticamente lo stato di tutti i campi
3. **Salvataggio**: I dati vengono salvati nel campo JSON `sopralluogoData` dell'intervento
4. **Validazione**: Aggiungi validazione personalizzata se necessario

## Personalizzazione

Per modificare i campi:
1. Modifica lo stato iniziale in `SopralluogoForm`
2. Aggiungi/rimuovi campi nei componenti `FormZanzare`, `FormRatti`, `FormBlatte`
3. Aggiorna la logica di `handleSubmit` se necessario
