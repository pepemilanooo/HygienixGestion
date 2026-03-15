import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fattureAPI } from '../services/api'
import { ArrowLeft, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FatturaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [f, setF] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fattureAPI.getById(id).then(r => setF(r.data.data)).catch(() => toast.error('Fattura non trovata')).finally(() => setLoading(false))
  }, [id])

  const segnaPagata = async () => {
    try {
      await fattureAPI.update(id, { statoPagamento: 'pagata' })
      toast.success('Fattura segnata come pagata')
      fattureAPI.getById(id).then(r => setF(r.data.data))
    } catch (err) {
      toast.error('Errore')
    }
  }

  if (loading || !f) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statoBadge = { non_pagata: 'bg-red-100 text-red-800', pagata: 'bg-green-100 text-green-800', parziale: 'bg-yellow-100 text-yellow-800' }
  const statoLabel = { non_pagata: 'Da pagare', pagata: 'Pagata', parziale: 'Parziale' }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{f.numero}</h1>
              <p className="text-gray-500">{f.client?.ragioneSociale}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${statoBadge[f.statoPagamento] || 'bg-gray-100'}`}>{statoLabel[f.statoPagamento] || f.statoPagamento}</span>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Data</span><p className="font-medium">{f.data ? new Date(f.data).toLocaleDateString('it-IT') : '-'}</p></div>
          <div><span className="text-gray-500">Scadenza pagamento</span><p className="font-medium">{f.scadenzaPagamento ? new Date(f.scadenzaPagamento).toLocaleDateString('it-IT') : '-'}</p></div>
          <div><span className="text-gray-500">Subtotale</span><p className="font-medium">€ {f.subtotale?.toFixed(2)}</p></div>
          <div><span className="text-gray-500">IVA 22%</span><p className="font-medium">€ {f.iva?.toFixed(2)}</p></div>
        </div>
        <p className="text-xl font-bold mt-4">Totale: € {f.totale?.toFixed(2)}</p>
        {f.note && <p className="mt-4 text-gray-600 border-t pt-4">Note: {f.note}</p>}
        {f.statoPagamento !== 'pagata' && (
          <button onClick={segnaPagata} className="mt-4 btn-primary">Segna come pagata</button>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Righe</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2">Descrizione</th>
              <th className="pb-2 text-right">Qtà</th>
              <th className="pb-2 text-right">Prezzo unit.</th>
              <th className="pb-2 text-right">Totale</th>
            </tr>
          </thead>
          <tbody>
            {(f.righe || []).map((r, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{r.descrizione}</td>
                <td className="py-2 text-right">{r.quantita}</td>
                <td className="py-2 text-right">€ {r.prezzoUnitario?.toFixed(2)}</td>
                <td className="py-2 text-right font-medium">€ {r.totale?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
