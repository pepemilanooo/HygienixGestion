import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { interventionsAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Search, Plus, Filter, MapPin, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function Interventions() {
  const { user } = useAuthStore()
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadInterventions()
  }, [filter])

  const loadInterventions = async () => {
    try {
      const params = {}
      if (filter) params.stato = filter
      if (user?.ruolo === 'tecnico') params.tecnicoId = user.id

      const response = await interventionsAPI.getAll(params)
      setInterventions(response.data.data)
    } catch (error) {
      toast.error('Errore caricamento interventi')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (stato) => {
    const styles = {
      completato: 'bg-green-100 text-green-800',
      in_corso: 'bg-yellow-100 text-yellow-800',
      pianificato: 'bg-blue-100 text-blue-800',
    }
    return styles[stato] || 'bg-gray-100 text-gray-800'
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
        <h1 className="text-2xl font-bold text-gray-900">Interventi</h1>
        {user?.ruolo !== 'tecnico' && (
          <Link to="/interventions/new" className="btn-primary flex items-center justify-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Nuovo Intervento</span>
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        <select 
          className="input w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Tutti gli stati</option>
          <option value="pianificato">Pianificato</option>
          <option value="in_corso">In Corso</option>
          <option value="completato">Completato</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {interventions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessun intervento trovato</div>
        ) : (
          <div className="divide-y">
            {interventions.map((i) => (
              <Link
                key={i.id}
                to={`/interventions/${i.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(i.stato)}`}>
                        {i.stato}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{i.client?.ragioneSociale}</h3>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{i.location?.nomeSede}</p>
                      <p className="flex items-center"><Calendar className="h-4 w-4 mr-1" />
                        {i.dataProgrammata && format(new Date(i.dataProgrammata), 'dd MMM yyyy HH:mm', { locale: it })}
                      </p>
                      {i.tecnico && (
                        <p className="flex items-center"><User className="h-4 w-4 mr-1" />
                          {i.tecnico.nome} {i.tecnico.cognome}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
