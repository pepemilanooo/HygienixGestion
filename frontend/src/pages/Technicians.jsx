import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tecniciAPI } from '../services/api'
import { UserCircle, Phone, Mail, Plus, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Technicians() {
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    loadTechnicians()
  }, [showInactive])

  const loadTechnicians = async () => {
    try {
      const params = showInactive ? {} : { attivo: 'true' }
      const response = await tecniciAPI.getAll(params)
      setTechnicians(response.data.data || [])
    } catch (error) {
      toast.error('Errore caricamento tecnici')
    } finally {
      setLoading(false)
    }
  }

  const handleDisattiva = async (t, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Disattivare il tecnico ${t.nome} ${t.cognome}? Non potrà più accedere.`)) return
    try {
      await tecniciAPI.update(t.id, { attivo: false })
      toast.success('Tecnico disattivato')
      loadTechnicians()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore')
    }
  }

  const handleRiattiva = async (t, e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await tecniciAPI.update(t.id, { attivo: true })
      toast.success('Tecnico riattivato')
      loadTechnicians()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tecnici</h1>
        <Link to="/technicians/new" className="btn-primary flex items-center justify-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nuovo Tecnico</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">Mostra anche tecnici disattivati</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {technicians.map((t) => (
          <div
            key={t.id}
            className={`card flex items-start space-x-4 ${!t.attivo ? 'opacity-75 bg-gray-50' : ''}`}
          >
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <UserCircle className="h-8 w-8 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{t.nome} {t.cognome}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${t.attivo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                  {t.attivo ? 'Attivo' : 'Disattivato'}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p className="flex items-center truncate"><Mail className="h-4 w-4 mr-2 flex-shrink-0" />{t.email}</p>
                {t.telefono && <p className="flex items-center"><Phone className="h-4 w-4 mr-2 flex-shrink-0" />{t.telefono}</p>}
              </div>
              {t.attivo ? (
                <button
                  type="button"
                  onClick={(e) => handleDisattiva(t, e)}
                  className="mt-3 text-sm text-red-600 hover:underline flex items-center gap-1"
                >
                  <UserX className="h-4 w-4" /> Disattiva tecnico
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleRiattiva(t, e)}
                  className="mt-3 text-sm text-primary-600 hover:underline"
                >
                  Riattiva tecnico
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {technicians.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          {showInactive ? 'Nessun tecnico trovato.' : 'Nessun tecnico attivo. Aggiungine uno o mostra i disattivati.'}
        </p>
      )}
    </div>
  )
}
