import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clientsAPI } from '../services/api'
import { Search, Plus, Building2, MapPin, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAttivo, setFilterAttivo] = useState('true') // 'true' | 'false' | '' = tutti

  useEffect(() => {
    loadClients()
  }, [search, filterAttivo])

  const loadClients = async () => {
    try {
      const params = { search }
      if (filterAttivo !== '') params.attivo = filterAttivo
      const response = await clientsAPI.getAll(params)
      setClients(response.data.data)
    } catch (error) {
      toast.error('Errore caricamento clienti')
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
        <Link to="/clients/new" className="btn-primary flex items-center justify-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nuovo Cliente</span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca cliente..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={filterAttivo}
          onChange={(e) => setFilterAttivo(e.target.value)}
        >
          <option value="true">Solo attivi</option>
          <option value="false">Solo archiviati</option>
          <option value="">Tutti</option>
        </select>
        <button onClick={loadClients} className="btn-primary">Cerca</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessun cliente trovato</div>
        ) : (
          <div className="divide-y">
            {clients.map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{client.ragioneSociale}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${client.attivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {client.attivo ? 'Attivo' : 'Inattivo'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                      <span>{client.email}</span>
                      <span>{client.telefono}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {client._count?.locations || 0} sedi • {client._count?.interventions || 0} interventi
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
