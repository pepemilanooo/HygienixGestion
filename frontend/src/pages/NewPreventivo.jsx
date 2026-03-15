import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { preventiviAPI, clientsAPI } from '../services/api'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewPreventivo() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    data: new Date().toISOString().slice(0, 10),
    scadenza: '',
    stato: 'bozza',
    note: ''
  })
  const [righe, setRighe] = useState([
    { descrizione: '', quantita: 1, prezzoUnitario: 0 }
  ])

  useEffect(() => {
    clientsAPI.getAll().then(r => setClients(r.data.data || [])).catch(() => {})
  }, [])

  const addRiga = () => setRighe([...righe, { descrizione: '', quantita: 1, prezzoUnitario: 0 }])
  const removeRiga = (i) => setRighe(righe.filter((_, j) => j !== i))
  const updateRiga = (i, field, value) => {
    const next = [...righe]
    next[i] = { ...next[i], [field]: value }
    if (field === 'quantita' || field === 'prezzoUnitario') {
      next[i].totale = (next[i].quantita || 1) * (next[i].prezzoUnitario || 0)
    }
    setRighe(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.clientId) {
      toast.error('Seleziona un cliente')
      return
    }
    const righeValide = righe.filter(r => r.descrizione?.trim())
    if (righeValide.length === 0) {
      toast.error('Aggiungi almeno una riga con descrizione')
      return
    }
    setLoading(true)
    try {
      await preventiviAPI.create({
        ...formData,
        righe: righeValide.map(r => ({
          descrizione: r.descrizione.trim(),
          quantita: r.quantita || 1,
          prezzoUnitario: r.prezzoUnitario || 0
        }))
      })
      toast.success('Preventivo creato')
      navigate('/preventivi')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore creazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Nuovo Preventivo</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Cliente *</label>
            <select
              required
              className="input"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">Seleziona cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Data</label>
            <input
              type="date"
              className="input"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Scadenza</label>
            <input
              type="date"
              className="input"
              value={formData.scadenza}
              onChange={(e) => setFormData({ ...formData, scadenza: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Stato</label>
            <select
              className="input"
              value={formData.stato}
              onChange={(e) => setFormData({ ...formData, stato: e.target.value })}
            >
              <option value="bozza">Bozza</option>
              <option value="inviato">Inviato</option>
              <option value="accettato">Accettato</option>
              <option value="rifiutato">Rifiutato</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Note</label>
          <textarea rows={2} className="input" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="label mb-0">Righe</label>
            <button type="button" onClick={addRiga} className="btn-secondary text-sm flex items-center gap-1">
              <Plus className="h-4 w-4" /> Aggiungi riga
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Descrizione</th>
                  <th className="text-right py-2 w-24">Qtà</th>
                  <th className="text-right py-2 w-28">Prezzo unit.</th>
                  <th className="text-right py-2 w-24">Totale</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {righe.map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">
                      <input
                        type="text"
                        className="input py-1 text-sm"
                        placeholder="Descrizione"
                        value={r.descrizione}
                        onChange={(e) => updateRiga(i, 'descrizione', e.target.value)}
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className="input py-1 text-sm w-20 text-right"
                        value={r.quantita}
                        onChange={(e) => updateRiga(i, 'quantita', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="input py-1 text-sm w-24 text-right"
                        value={r.prezzoUnitario || ''}
                        onChange={(e) => updateRiga(i, 'prezzoUnitario', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 text-right font-medium">
                      € {((r.quantita || 1) * (r.prezzoUnitario || 0)).toFixed(2)}
                    </td>
                    <td>
                      <button type="button" onClick={() => removeRiga(i)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-2">IVA 22% calcolata automaticamente sul subtotale.</p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Annulla</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvataggio...' : 'Crea Preventivo'}</button>
        </div>
      </form>
    </div>
  )
}
