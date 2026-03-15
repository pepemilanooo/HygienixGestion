import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fattureAPI, clientsAPI, preventiviAPI } from '../services/api'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewFattura() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preventivoIdFromUrl = searchParams.get('preventivoId')
  const [clients, setClients] = useState([])
  const [preventivi, setPreventivi] = useState([])
  const [loading, setLoading] = useState(false)
  const [daPreventivo, setDaPreventivo] = useState(!!preventivoIdFromUrl)
  const [formData, setFormData] = useState({
    clientId: '',
    preventivoId: preventivoIdFromUrl || '',
    data: new Date().toISOString().slice(0, 10),
    scadenzaPagamento: '',
    note: ''
  })
  const [righe, setRighe] = useState([{ descrizione: '', quantita: 1, prezzoUnitario: 0 }])

  useEffect(() => {
    clientsAPI.getAll().then(r => setClients(r.data.data || [])).catch(() => {})
    preventiviAPI.getAll({ stato: 'accettato' }).then(r => setPreventivi(r.data.data || [])).catch(() => {})
  }, [])

  const addRiga = () => setRighe([...righe, { descrizione: '', quantita: 1, prezzoUnitario: 0 }])
  const removeRiga = (i) => setRighe(righe.filter((_, j) => j !== i))
  const updateRiga = (i, field, value) => {
    const next = [...righe]
    next[i] = { ...next[i], [field]: value }
    setRighe(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (daPreventivo && formData.preventivoId) {
      setLoading(true)
      try {
        await fattureAPI.create({
          preventivoId: formData.preventivoId,
          data: formData.data,
          scadenzaPagamento: formData.scadenzaPagamento || null,
          note: formData.note
        })
        toast.success('Fattura creata dal preventivo')
        navigate('/fatture')
      } catch (err) {
        toast.error(err.response?.data?.message || 'Errore')
      } finally {
        setLoading(false)
      }
      return
    }
    if (!formData.clientId) {
      toast.error('Seleziona un cliente')
      return
    }
    const righeValide = righe.filter(r => r.descrizione?.trim())
    if (righeValide.length === 0) {
      toast.error('Aggiungi almeno una riga')
      return
    }
    setLoading(true)
    try {
      await fattureAPI.create({
        clientId: formData.clientId,
        data: formData.data,
        scadenzaPagamento: formData.scadenzaPagamento || null,
        note: formData.note,
        righe: righeValide.map(r => ({
          descrizione: r.descrizione.trim(),
          quantita: r.quantita || 1,
          prezzoUnitario: r.prezzoUnitario || 0
        }))
      })
      toast.success('Fattura creata')
      navigate('/fatture')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Nuova Fattura</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="daPreventivo"
            checked={daPreventivo}
            onChange={(e) => setDaPreventivo(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="daPreventivo">Crea da preventivo accettato</label>
        </div>

        {daPreventivo ? (
          <div>
            <label className="label">Preventivo *</label>
            <select
              required
              className="input"
              value={formData.preventivoId}
              onChange={(e) => setFormData({ ...formData, preventivoId: e.target.value })}
            >
              <option value="">Seleziona preventivo...</option>
              {preventivi.map(p => (
                <option key={p.id} value={p.id}>{p.numero} - {p.client?.ragioneSociale} (€ {p.totale?.toFixed(2)})</option>
              ))}
            </select>
            {preventivi.length === 0 && <p className="text-sm text-gray-500 mt-1">Nessun preventivo accettato. Crea fattura da zero deselezionando l’opzione sopra.</p>}
          </div>
        ) : (
          <>
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
                          <input type="text" className="input py-1 text-sm" placeholder="Descrizione" value={r.descrizione} onChange={(e) => updateRiga(i, 'descrizione', e.target.value)} />
                        </td>
                        <td className="py-2 text-right">
                          <input type="number" min={0} step={1} className="input py-1 text-sm w-20 text-right" value={r.quantita} onChange={(e) => updateRiga(i, 'quantita', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="py-2 text-right">
                          <input type="number" min={0} step={0.01} className="input py-1 text-sm w-24 text-right" value={r.prezzoUnitario || ''} onChange={(e) => updateRiga(i, 'prezzoUnitario', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="py-2 text-right font-medium">€ {((r.quantita || 1) * (r.prezzoUnitario || 0)).toFixed(2)}</td>
                        <td>
                          <button type="button" onClick={() => removeRiga(i)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
          </div>
          <div>
            <label className="label">Scadenza pagamento</label>
            <input type="date" className="input" value={formData.scadenzaPagamento} onChange={(e) => setFormData({ ...formData, scadenzaPagamento: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Note</label>
          <textarea rows={2} className="input" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Annulla</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvataggio...' : 'Crea Fattura'}</button>
        </div>
      </form>
    </div>
  )
}
