import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { preventiviAPI } from '../services/api'
import { ArrowLeft, FileText, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PreventivoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    preventiviAPI.getById(id).then(r => setP(r.data.data)).catch(() => toast.error('Preventivo non trovato')).finally(() => setLoading(false))
  }, [id])

  if (loading || !p) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statoBadge = { bozza: 'bg-gray-100 text-gray-800', inviato: 'bg-blue-100 text-blue-800', accettato: 'bg-green-100 text-green-800', rifiutato: 'bg-red-100 text-red-800' }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{p.numero}</h1>
              <p className="text-gray-500">{p.client?.ragioneSociale}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${statoBadge[p.stato] || 'bg-gray-100'}`}>{p.stato}</span>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Data</span><p className="font-medium">{p.data ? new Date(p.data).toLocaleDateString('it-IT') : '-'}</p></div>
          <div><span className="text-gray-500">Scadenza</span><p className="font-medium">{p.scadenza ? new Date(p.scadenza).toLocaleDateString('it-IT') : '-'}</p></div>
          <div><span className="text-gray-500">Subtotale</span><p className="font-medium">€ {p.subtotale?.toFixed(2)}</p></div>
          <div><span className="text-gray-500">IVA 22%</span><p className="font-medium">€ {p.iva?.toFixed(2)}</p></div>
        </div>
        <p className="text-xl font-bold mt-4">Totale: € {p.totale?.toFixed(2)}</p>
        {p.note && <p className="mt-4 text-gray-600 border-t pt-4">Note: {p.note}</p>}
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
            {(p.righe || []).map((r, i) => (
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

      {p.stato === 'accettato' && !p.fattura && (
        <Link to={`/fatture/new?preventivoId=${p.id}`} className="btn-primary inline-flex items-center gap-2">
          <Receipt className="h-5 w-5" /> Emetti fattura
        </Link>
      )}
    </div>
  )
}
