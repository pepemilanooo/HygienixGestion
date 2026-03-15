import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { interventionsAPI, clientsAPI, locationsAPI, tipiInterventoAPI, tecniciAPI } from '../services/api'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewSopralluogo() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [locations, setLocations] = useState([])
  const [tecnici, setTecnici] = useState([])
  const [tipoSopralluogoId, setTipoSopralluogoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    locationId: '',
    dataProgrammata: '',
    tecnicoId: '',
    noteInterne: ''
  })

  useEffect(() => {
    loadClients()
    loadTecnici()
    loadTipoSopralluogo()
  }, [])

  const loadTipoSopralluogo = async () => {
    try {
      const response = await tipiInterventoAPI.getAll()
      const tipi = response.data.data || []
      const sopr = tipi.find(t => t.codice === 'SOPR')
      if (sopr) setTipoSopralluogoId(sopr.id)
      else toast.error('Tipo "Sopralluogo" non trovato. Esegui il seed del database.')
    } catch (error) {
      toast.error('Errore caricamento tipo sopralluogo')
    }
  }

  const loadClients = async () => {
    try {
      const response = await clientsAPI.getAll()
      setClients(response.data.data || [])
    } catch (error) {
      toast.error('Errore caricamento clienti')
    }
  }

  const loadTecnici = async () => {
    try {
      const response = await tecniciAPI.getAll()
      setTecnici(response.data.data || [])
    } catch (error) {
      toast.error('Errore caricamento tecnici')
    }
  }

  const handleClientChange = async (clientId) => {
    setFormData(prev => ({ ...prev, clientId, locationId: '' }))
    setLocations([])
    if (!clientId) return
    setLoadingLocations(true)
    try {
      const response = await locationsAPI.getByClientId(clientId)
      setLocations(response.data.data || [])
    } catch (error) {
      toast.error('Errore caricamento sedi')
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!tipoSopralluogoId) {
      toast.error('Tipo Sopralluogo non disponibile')
      return
    }
    setLoading(true)
    try {
      const payload = {
        clientId: formData.clientId,
        locationId: formData.locationId,
        tipoInterventoId: tipoSopralluogoId,
        dataProgrammata: formData.dataProgrammata,
        noteInterne: formData.noteInterne || undefined
      }
      if (formData.tecnicoId && formData.tecnicoId.trim()) {
        payload.tecnicoId = formData.tecnicoId
      }
      await interventionsAPI.create(payload)
      toast.success('Sopralluogo creato!')
      navigate('/sopralluoghi')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Errore creazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Nuovo Sopralluogo</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Cliente *</label>
            <select
              required
              className="input"
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
            >
              <option value="">Seleziona cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.ragioneSociale}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Sede *</label>
            <select
              required
              className="input"
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              disabled={!formData.clientId || loadingLocations}
            >
              <option value="">
                {loadingLocations ? 'Caricamento sedi...' : locations.length === 0 && formData.clientId ? 'Nessuna sede (aggiungi sede al cliente)' : 'Seleziona sede...'}
              </option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.nomeSede}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Data e Ora *</label>
            <input
              type="datetime-local"
              required
              className="input"
              value={formData.dataProgrammata}
              onChange={(e) => setFormData({ ...formData, dataProgrammata: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Tecnico</label>
            <select
              className="input"
              value={formData.tecnicoId}
              onChange={(e) => setFormData({ ...formData, tecnicoId: e.target.value })}
            >
              <option value="">Da assegnare...</option>
              {tecnici.map((t) => (
                <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Note Interne</label>
          <textarea
            rows={3}
            className="input"
            value={formData.noteInterne}
            onChange={(e) => setFormData({ ...formData, noteInterne: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Annulla
          </button>
          <button type="submit" disabled={loading || !tipoSopralluogoId} className="btn-primary">
            {loading ? 'Salvataggio...' : 'Crea Sopralluogo'}
          </button>
        </div>
      </form>
    </div>
  )
}
