import { useState } from 'react'
import { interventionsAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Form dinamico per sopraluoghi - Supporta: zanzare, ratti, blatte
export default function SopralluogoForm({ interventionId, tipoSopralluogo, onComplete }) {
  const [loading, setLoading] = useState(false)
  
  // Stato base comune a tutti i tipi
  const [formData, setFormData] = useState({
    // Dati comuni
    tipoStruttura: '',
    condizioniIgieniche: '',
    localiCommerciali: false,
    tipoLocaleCommerciale: '',
    orarioPreferenziale: '',
    giorni: [],
    dataSopralluogo: new Date().toISOString().split('T')[0],
    numeroInterventiAnnui: '',
    mesiIntervento: '',
    
    // Dati specifici ZANZARE
    timpesticaLarvicida: '',
    timpesticaAdulticidaInv: '',
    timpesticaAdulticidaPrimavera: '',
    tipoInfestazione: {
      larvicida: '',
      adulticidaInv: '',
      adulticidaPrimavera: ''
    },
    areeTrattamento: {
      pozzetti: { qta: '', tempistica: '' },
      cantina: { qta: '', tempistica: '' },
      caldaia: { qta: '', tempistica: '' },
      autoclaave: { qta: '', tempistica: '' },
      localePompe: { qta: '', tempistica: '' },
      areaVerde: { qta: '', tempistica: '' },
      areaBox: { qta: '', tempistica: '' },
      androni: { qta: '', tempistica: '' }
    },
    
    // Dati specifici RATTI
    tipoInfestazioneRatti: {
      topolinoDomestico: '',
      rattoFogna: '',
      rattoNero: ''
    },
    areeRatti: {
      blackBox: false,
      miniBait: false,
      cantina: false,
      localeAutoclave: false,
      localeContatori: false,
      centraleTermica: false,
      areaBox: false,
      perimetroEdificio: false,
      localePompe: false,
      pozzetti: false,
      isola: false,
      latoRaccoltaRifiuti: false,
      areaVerde: false
    },
    qtaProdotto: '',
    
    // Dati specifici BLATTE
    tipoInfestazioneBlatte: {
      scarafaggioNero: '',
      blattellaGermanica: ''
    },
    areeBlatte: {
      cantina: false,
      localeAutoclave: false,
      localeContatori: false,
      centraleTermica: false,
      lrr: false,
      areaBox: false,
      perimetroEdificio: false,
      localePompe: false,
      pozzetti: false,
      isola: false,
      perimetroScale: false,
      fossaBiologica: false,
      latoRaccoltaRifiuti: false,
      puntoAcqua: false
    }
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleGiorniChange = (giorno) => {
    setFormData(prev => ({
      ...prev,
      giorni: prev.giorni.includes(giorno)
        ? prev.giorni.filter(g => g !== giorno)
        : [...prev.giorni, giorno]
    }))
  }

  const handleNestedChange = (group, field, value) => {
    setFormData(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value
      }
    }))
  }

  const handleAreaChange = (tipo, area, field, value) => {
    setFormData(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [area]: field 
          ? { ...prev[tipo][area], [field]: value }
          : value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepara i dati da salvare (filtra solo i campi rilevanti per il tipo)
      const datiDaSalvare = {
        ...formData,
        // Includi solo le aree specifiche per il tipo
        aree: tipoSopralluogo === 'ratti' ? formData.areeRatti :
              tipoSopralluogo === 'blatte' ? formData.areeBlatte :
              formData.areeTrattamento
      }

      await interventionsAPI.saveSopralluogo(interventionId, {
        tipoSopralluogo,
        dati: datiDaSalvare
      })

      toast.success('Sopralluogo salvato con successo!')
      onComplete?.()
    } catch (error) {
      console.error('Errore salvataggio:', error)
      toast.error('Errore nel salvataggio del sopralluogo')
    } finally {
      setLoading(false)
    }
  }

  // Render condizionale in base al tipo
  const renderFormTipo = () => {
    switch (tipoSopralluogo) {
      case 'zanzare':
        return <FormZanzare formData={formData} onChange={handleInputChange} onAreaChange={handleAreaChange} />
      case 'ratti':
        return <FormRatti formData={formData} onChange={handleInputChange} onAreaChange={handleAreaChange} />
      case 'blatte':
        return <FormBlatte formData={formData} onChange={handleInputChange} onAreaChange={handleAreaChange} />
      default:
        return <p>Seleziona un tipo di sopralluogo</p>
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">
        Sopralluogo: {tipoSopralluogo?.toUpperCase()}
      </h2>

      {/* SEZIONE COMUNE - Dati generali */}
      <section className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Dati Generali</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo Struttura</label>
            <select 
              name="tipoStruttura" 
              value={formData.tipoStruttura}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleziona...</option>
              <option value="palazzo_popolare">Palazzo Popolare</option>
              <option value="casa_ringhiera">Casa di Ringhiera</option>
              <option value="palazzo_benestante">Palazzo Benestante</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Condizioni Igieniche</label>
            <select 
              name="condizioniIgieniche" 
              value={formData.condizioniIgieniche}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleziona...</option>
              <option value="pessime">Pessime</option>
              <option value="buone">Buone</option>
              <option value="ottime">Ottime</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data Sopralluogo</label>
            <input 
              type="date" 
              name="dataSopralluogo"
              value={formData.dataSopralluogo}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">N° Interventi Annuali</label>
            <input 
              type="number" 
              name="numeroInterventiAnnui"
              value={formData.numeroInterventiAnnui}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Locali Commerciali */}
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="localiCommerciali"
              checked={formData.localiCommerciali}
              onChange={handleInputChange}
            />
            <span className="text-sm font-medium">Presenza Locali Commerciali</span>
          </label>
          
          {formData.localiCommerciali && (
            <select 
              name="tipoLocaleCommerciale"
              value={formData.tipoLocaleCommerciale}
              onChange={handleInputChange}
              className="mt-2 w-full border rounded px-3 py-2"
            >
              <option value="">Tipo locale...</option>
              <option value="bar">Bar</option>
              <option value="ristorante">Ristorante</option>
              <option value="panificio">Panificio</option>
              <option value="altro">Altro</option>
            </select>
          )}
        </div>

        {/* Orario e Giorni */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Orario Preferenziale</label>
            <select 
              name="orarioPreferenziale" 
              value={formData.orarioPreferenziale}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleziona...</option>
              <option value="mattina">Mattina</option>
              <option value="pomeriggio">Pomeriggio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Giorni</label>
            <div className="flex flex-wrap gap-2">
              {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'].map(giorno => (
                <label key={giorno} className="flex items-center gap-1 text-sm">
                  <input 
                    type="checkbox"
                    checked={formData.giorni.includes(giorno)}
                    onChange={() => handleGiorniChange(giorno)}
                  />
                  {giorno}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FORM SPECIFICO PER TIPO */}
      {renderFormTipo()}

      {/* Mesi Intervento */}
      <div>
        <label className="block text-sm font-medium mb-1">Mesi Intervento</label>
        <input 
          type="text" 
          name="mesiIntervento"
          value={formData.mesiIntervento}
          onChange={handleInputChange}
          placeholder="Es: Gennaio, Febbraio, Marzo..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Submit */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Salvataggio...' : 'Completa Sopralluogo'}
      </button>
    </form>
  )
}

// ============ FORM ZANZARE ============
function FormZanzare({ formData, onChange, onAreaChange }) {
  return (
    <section className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-4">Dati Specifici - Zanzare</h3>
      
      {/* Timpestiche */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Timpestica Larvicida</label>
          <input 
            type="text" 
            name="timpesticaLarvicida"
            value={formData.timpesticaLarvicida}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Timpestica Adulticida Inv.</label>
          <input 
            type="text" 
            name="timpesticaAdulticidaInv"
            value={formData.timpesticaAdulticidaInv}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Timpestica Adulticida Primavera</label>
          <input 
            type="text" 
            name="timpesticaAdulticidaPrimavera"
            value={formData.timpesticaAdulticidaPrimavera}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Tipo Infestazione */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Tipo Infestazione</h4>
        <div className="grid grid-cols-3 gap-4">
          {['larvicida', 'adulticidaInv', 'adulticidaPrimavera'].map(tipo => (
            <div key={tipo}>
              <label className="block text-sm font-medium mb-1 capitalize">{tipo}</label>
              <select 
                value={formData.tipoInfestazione[tipo]}
                onChange={(e) => onAreaChange('tipoInfestazione', tipo, null, e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleziona...</option>
                <option value="piccola">Piccola Presenza</option>
                <option value="media">Media Presenza</option>
                <option value="alta">Alta Presenza</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Aree Trattamento */}
      <div>
        <h4 className="font-medium mb-2">Aree Trattamento - Larvicida</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.areeTrattamento).slice(0, 5).map(([area, dati]) => (
            <div key={area} className="bg-white p-3 rounded">
              <label className="font-medium capitalize">{area}</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input 
                  type="text"
                  placeholder="Q.tà"
                  value={dati.qta}
                  onChange={(e) => onAreaChange('areeTrattamento', area, 'qta', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
                <input 
                  type="text"
                  placeholder="Tempistica"
                  value={dati.tempistica}
                  onChange={(e) => onAreaChange('areeTrattamento', area, 'tempistica', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <h4 className="font-medium mb-2 mt-4">Aree Trattamento - Adulticida</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.areeTrattamento).slice(5).map(([area, dati]) => (
            <div key={area} className="bg-white p-3 rounded">
              <label className="font-medium capitalize">{area}</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input 
                  type="text"
                  placeholder="Q.tà"
                  value={dati.qta}
                  onChange={(e) => onAreaChange('areeTrattamento', area, 'qta', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
                <input 
                  type="text"
                  placeholder="Tempistica"
                  value={dati.tempistica}
                  onChange={(e) => onAreaChange('areeTrattamento', area, 'tempistica', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ FORM RATTI ============
function FormRatti({ formData, onChange, onAreaChange }) {
  return (
    <section className="bg-green-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-4">Dati Specifici - Ratti</h3>
      
      {/* Tipo Infestazione */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Tipo Infestazione</h4>
        <div className="grid grid-cols-3 gap-4">
          {['topolinoDomestico', 'rattoFogna', 'rattoNero'].map(tipo => (
            <div key={tipo}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {tipo.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <select 
                value={formData.tipoInfestazioneRatti[tipo]}
                onChange={(e) => onAreaChange('tipoInfestazioneRatti', tipo, null, e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleziona...</option>
                <option value="piccola">Piccola Presenza</option>
                <option value="media">Media Presenza</option>
                <option value="alta">Alta Presenza</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Aree */}
      <div>
        <h4 className="font-medium mb-2">Aree da Trattare</h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(formData.areeRatti).map(([area, checked]) => (
            <label key={area} className="flex items-center gap-2 bg-white p-2 rounded">
              <input 
                type="checkbox"
                checked={checked}
                onChange={(e) => onAreaChange('areeRatti', area, null, e.target.checked)}
              />
              <span className="text-sm capitalize">{area.replace(/([A-Z])/g, ' $1').trim()}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quantità Prodotto */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Quantità Prodotto</label>
        <input 
          type="text" 
          name="qtaProdotto"
          value={formData.qtaProdotto}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
    </section>
  )
}

// ============ FORM BLATTE ============
function FormBlatte({ formData, onChange, onAreaChange }) {
  return (
    <section className="bg-yellow-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-4">Dati Specifici - Blatte</h3>
      
      {/* Tipo Infestazione */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Tipo Infestazione</h4>
        <div className="grid grid-cols-2 gap-4">
          {['scarafaggioNero', 'blattellaGermanica'].map(tipo => (
            <div key={tipo}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {tipo.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <select 
                value={formData.tipoInfestazioneBlatte[tipo]}
                onChange={(e) => onAreaChange('tipoInfestazioneBlatte', tipo, null, e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleziona...</option>
                <option value="piccola">Piccola Presenza</option>
                <option value="media">Media Presenza</option>
                <option value="alta">Alta Presenza</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Aree */}
      <div>
        <h4 className="font-medium mb-2">Aree da Trattare</h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(formData.areeBlatte).map(([area, checked]) => (
            <label key={area} className="flex items-center gap-2 bg-white p-2 rounded">
              <input 
                type="checkbox"
                checked={checked}
                onChange={(e) => onAreaChange('areeBlatte', area, null, e.target.checked)}
              />
              <span className="text-sm capitalize">{area.replace(/([A-Z])/g, ' $1').trim()}</span>
            </label>
          ))}
        </div>
      </div>

      {/* N° Interventi e Tempistica */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">N° Interventi Annuali</label>
          <input 
            type="number" 
            name="numeroInterventiAnnui"
            value={formData.numeroInterventiAnnui}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tempistica</label>
          <input 
            type="text" 
            name="timpestica"
            value={formData.timpestica}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
    </section>
  )
}
