import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { preventiviAPI, clientsAPI } from '../services/api'
import { FileText, Plus, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Preventivi() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState([])

  useEffect(() => {
    loadPreventivi()
    clientsAPI.getAll().then(r => setClients(r.data.data || [])).catch(() => {})
  }, [clientId])

  const loadPreventivi = async () => {
    try {
      const params = clientId ? { clientId } : {}
      const response = await preventiviAPI.getAll(params)
      setList(response.data.data || [])
    } catch (error) {
      toast.error('Errore caricamento preventivi')
    } finally {
      setLoading(false)
    }
  }

  const statoBadge = (stato) => {
    const map = { bozza: 'bg-gray-100 text-gray-800', inviato: 'bg-blue-100 text-blue-800', accettato: 'bg-green-100 text-green-800', rifiutato: 'bg-red-100 text-red-800' }
    return map[stato] || 'bg-gray-100 text-gray-800'
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
        <h1 className="text-2xl font-bold text-gray-900">Preventivi</h1>
        <Link to="/preventivi/new" className="btn-primary flex items-center justify-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nuovo Preventivo</span>
        </Link>
      </div>

      <div className="flex gap-2">
        <select
          className="input max-w-xs"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Tutti i clienti</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessun preventivo</div>
        ) : (
          <div className="divide-y">
            {list.map((p) => (
              <Link key={p.id} to={`/preventivi/${p.id}`} className="block p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{p.numero}</p>
                      <p className="text-sm text-gray-500">{p.client?.ragioneSociale}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">€ {p.totale?.toFixed(2)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${statoBadge(p.stato)}`}>{p.stato}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
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
