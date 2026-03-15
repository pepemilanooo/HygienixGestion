import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { clientsAPI, uploadAPI, locationsAPI } from '../services/api'
import { Building2, MapPin, Phone, Mail, FileText, ArrowLeft, Upload, Plus, Archive, ArchiveRestore, Receipt, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [showAddSede, setShowAddSede] = useState(false)
  const [sedeForm, setSedeForm] = useState({ nomeSede: '', indirizzo: '', citta: '', cap: '', provincia: '' })
  const [archiving, setArchiving] = useState(false)
  const [uploadingFattura, setUploadingFattura] = useState(false)
  const [fatturaNome, setFatturaNome] = useState('')
  const [fatturaData, setFatturaData] = useState('')
  const [documenti, setDocumenti] = useState([])

  useEffect(() => {
    loadClient()
  }, [id])

  const loadClient = async () => {
    try {
      const [clientRes, docRes] = await Promise.all([
        clientsAPI.getById(id),
        clientsAPI.getDocumenti(id).catch(() => ({ data: { data: [] } }))
      ])
      setClient(clientRes.data.data)
      setDocumenti(Array.isArray(docRes?.data?.data) ? docRes.data.data : [])
    } catch (error) {
      toast.error('Cliente non trovato')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadContratto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Solo file PDF consentiti')
      return
    }
    setUploadingDoc(true)
    try {
      const res = await uploadAPI.documento(file)
      const url = res.data.data?.url
      if (!url) throw new Error('URL non restituito')
      await clientsAPI.update(id, { contrattoUrl: url })
      toast.success('Contratto caricato')
      loadClient()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore caricamento')
    } finally {
      setUploadingDoc(false)
      e.target.value = ''
    }
  }

  const handleArchivia = async () => {
    if (!window.confirm('Archiviare questo cliente? Non apparirà più tra i clienti attivi.')) return
    setArchiving(true)
    try {
      await clientsAPI.update(id, { attivo: false })
      toast.success('Cliente archiviato')
      loadClient()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore')
    } finally {
      setArchiving(false)
    }
  }

  const handleUploadFattura = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Solo file PDF consentiti')
      return
    }
    setUploadingFattura(true)
    try {
      const res = await uploadAPI.documento(file)
      const url = res.data.data?.url
      if (!url) throw new Error('URL non restituito')
      await clientsAPI.addDocumento(id, {
        url,
        nome: fatturaNome.trim() || file.name || 'Fattura',
        tipo: 'fattura',
        dataDocumento: fatturaData || null
      })
      toast.success('Fattura caricata')
      setFatturaNome('')
      setFatturaData('')
      loadClient()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore caricamento')
    } finally {
      setUploadingFattura(false)
      e.target.value = ''
    }
  }

  const handleDeleteDocumento = async (docId) => {
    if (!window.confirm('Eliminare questo documento?')) return
    try {
      await clientsAPI.deleteDocumento(id, docId)
      toast.success('Documento rimosso')
      loadClient()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore')
    }
  }

  const handleRiattiva = async () => {
    setArchiving(true)
    try {
      await clientsAPI.update(id, { attivo: true })
      toast.success('Cliente riattivato')
      loadClient()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore')
    } finally {
      setArchiving(false)
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
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client?.ragioneSociale}</h1>
            <p className="text-gray-500 mt-1">{client?.tipo}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              client?.attivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {client?.attivo ? 'Attivo' : 'Archiviato'}
            </span>
            {client?.attivo ? (
              <button
                type="button"
                onClick={handleArchivia}
                disabled={archiving}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <Archive className="h-4 w-4" /> Archivia cliente
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRiattiva}
                disabled={archiving}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <ArchiveRestore className="h-4 w-4" /> Riattiva cliente
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Contatti</h3>
            <div className="space-y-2">
              <p className="flex items-center text-gray-600"><Mail className="h-4 w-4 mr-2" /> {client?.email || '-'}</p>
              <p className="flex items-center text-gray-600"><Phone className="h-4 w-4 mr-2" /> {client?.telefono || '-'}</p>
              {(client?.piva || client?.codiceFiscale) && (
                <p className="text-sm text-gray-500 mt-2">
                  {client.piva && <>P.IVA {client.piva}</>}
                  {client.piva && client.codiceFiscale && ' · '}
                  {client.codiceFiscale && <>CF {client.codiceFiscale}</>}
                </p>
              )}
              <div className="mt-2">
                <label className="text-xs text-gray-500">Consigliere (opzionale)</label>
                <input
                  type="text"
                  className="input mt-1 py-1 text-sm"
                  placeholder="Aggiungi consigliere"
                  value={client?.consigliere ?? ''}
                  onChange={(e) => setClient(prev => prev ? { ...prev, consigliere: e.target.value } : null)}
                  onBlur={async () => {
                    if (client?.consigliere !== undefined) {
                      try {
                        await clientsAPI.update(id, { consigliere: client.consigliere || null })
                        toast.success('Consigliere aggiornato')
                      } catch { /* ignore */ }
                    }
                  }}
                />
              </div>
              <div className="mt-2">
                <label className="text-xs text-gray-500">Telefono consigliere (opzionale)</label>
                <input
                  type="text"
                  className="input mt-1 py-1 text-sm"
                  placeholder="Telefono consigliere"
                  value={client?.telefonoConsigliere ?? ''}
                  onChange={(e) => setClient(prev => prev ? { ...prev, telefonoConsigliere: e.target.value } : null)}
                  onBlur={async () => {
                    if (client?.telefonoConsigliere !== undefined) {
                      try {
                        await clientsAPI.update(id, { telefonoConsigliere: client.telefonoConsigliere || null })
                        toast.success('Telefono consigliere aggiornato')
                      } catch { /* ignore */ }
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Indirizzo</h3>
            <p className="flex items-start text-gray-600">
              <MapPin className="h-4 w-4 mr-2 mt-1" />
              <span>
                {client?.indirizzo}<br />
                {client?.cap} {client?.citta} ({client?.provincia})
              </span>
            </p>
          </div>
        </div>

        {client?.note && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Note</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded">{client.note}</p>
          </div>
        )}

        {/* Documenti / Contratto */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5" /> Documenti cliente
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {client?.contrattoUrl ? (
              <a
                href={`${API_BASE}${client.contrattoUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
              >
                <FileText className="h-4 w-4" /> Contratto PDF
              </a>
            ) : null}
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
              <Upload className="h-4 w-4" />
              {uploadingDoc ? 'Caricamento...' : (client?.contrattoUrl ? 'Sostituisci contratto' : 'Carica contratto PDF')}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                disabled={uploadingDoc}
                onChange={handleUploadContratto}
              />
            </label>
          </div>

          {/* Report interventi (generati alla chiusura di ogni intervento) */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Report interventi
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              I report PDF vengono creati in automatico quando un tecnico chiude un intervento. Qui trovi quelli assegnati a questo cliente.
            </p>
            {documenti.filter(d => d.tipo === 'report').length > 0 ? (
              <ul className="space-y-2">
                {documenti.filter(d => d.tipo === 'report').map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <a
                      href={`${API_BASE}${doc.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-indigo-700 hover:underline font-medium"
                    >
                      <FileText className="h-4 w-4" />
                      {doc.nome}
                      {doc.dataDocumento && (
                        <span className="text-gray-500 text-sm font-normal">
                          ({new Date(doc.dataDocumento).toLocaleDateString('it-IT')})
                        </span>
                      )}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocumento(doc.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">Nessun report presente. I report vengono generati automaticamente alla chiusura di ogni intervento (con firma tecnico).
              </p>
            )}
          </div>

          {/* Fatture caricate (da altri programmi) */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Fatture caricate
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Carica fatture emesse con altri programmi per tenerle collegate al cliente.
            </p>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <input
                type="text"
                className="input w-48"
                placeholder="Nome/descrizione (opzionale)"
                value={fatturaNome}
                onChange={(e) => setFatturaNome(e.target.value)}
              />
              <input
                type="date"
                className="input w-40"
                placeholder="Data fattura"
                value={fatturaData}
                onChange={(e) => setFatturaData(e.target.value)}
              />
              <label className="btn-primary cursor-pointer inline-flex items-center gap-2 py-2">
                <Upload className="h-4 w-4" />
                {uploadingFattura ? 'Caricamento...' : 'Carica PDF'}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={uploadingFattura}
                  onChange={handleUploadFattura}
                />
              </label>
            </div>
            {documenti.filter(d => d.tipo !== 'report').length > 0 ? (
              <ul className="space-y-2">
                {documenti.filter(d => d.tipo !== 'report').map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <a
                      href={`${API_BASE}${doc.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {doc.nome}
                      {doc.dataDocumento && (
                        <span className="text-gray-500 text-sm">
                          ({new Date(doc.dataDocumento).toLocaleDateString('it-IT')})
                        </span>
                      )}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocumento(doc.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nessuna fattura caricata.</p>
            )}
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sedi ({client?.locations?.length || 0})</h2>
          <button type="button" onClick={() => setShowAddSede(!showAddSede)} className="btn-secondary text-sm flex items-center gap-1">
            <Plus className="h-4 w-4" /> Aggiungi sede
          </button>
        </div>
        {showAddSede && (
          <form
            className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!sedeForm.nomeSede.trim()) { toast.error('Nome sede obbligatorio'); return }
              try {
                await locationsAPI.create({
                  clientId: id,
                  nomeSede: sedeForm.nomeSede.trim(),
                  indirizzo: sedeForm.indirizzo.trim() || 'Da completare',
                  citta: sedeForm.citta.trim() || null,
                  cap: sedeForm.cap.trim() || null,
                  provincia: sedeForm.provincia.trim() || null
                })
                toast.success('Sede aggiunta')
                setSedeForm({ nomeSede: '', indirizzo: '', citta: '', cap: '', provincia: '' })
                setShowAddSede(false)
                loadClient()
              } catch (err) {
                toast.error(err.response?.data?.message || 'Errore')
              }
            }}
          >
            <input type="text" className="input" placeholder="Nome sede *" value={sedeForm.nomeSede} onChange={(e) => setSedeForm({ ...sedeForm, nomeSede: e.target.value })} required />
            <input type="text" className="input" placeholder="Indirizzo" value={sedeForm.indirizzo} onChange={(e) => setSedeForm({ ...sedeForm, indirizzo: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" className="input" placeholder="Città" value={sedeForm.citta} onChange={(e) => setSedeForm({ ...sedeForm, citta: e.target.value })} />
              <input type="text" className="input" placeholder="CAP" value={sedeForm.cap} onChange={(e) => setSedeForm({ ...sedeForm, cap: e.target.value })} />
            </div>
            <input type="text" className="input w-20" placeholder="PR" value={sedeForm.provincia} onChange={(e) => setSedeForm({ ...sedeForm, provincia: e.target.value.toUpperCase() })} />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Salva sede</button>
              <button type="button" onClick={() => setShowAddSede(false)} className="btn-secondary">Annulla</button>
            </div>
          </form>
        )}
        {client?.locations?.length === 0 && !showAddSede ? (
          <p className="text-gray-500">Nessuna sede registrata</p>
        ) : (
          <div className="space-y-3">
            {client?.locations?.map((loc) => (
              <div key={loc.id} className="p-4 border rounded-lg">
                <p className="font-medium text-gray-900">{loc.nomeSede}</p>
                <p className="text-sm text-gray-500">{loc.indirizzo}, {loc.citta}</p>
                {loc.latitudine && (
                  <p className="text-xs text-gray-400 mt-1">
                    GPS: {loc.latitudine.toFixed(4)}, {loc.longitudine?.toFixed(4)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Interventions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Interventi Recenti</h2>
        {client?.interventions?.length === 0 ? (
          <p className="text-gray-500">Nessun intervento</p>
        ) : (
          <div className="space-y-3">
            {client?.interventions?.map((i) => (
              <div key={i.id} className="p-4 border rounded-lg flex justify-between">
                <div>
                  <p className="font-medium text-gray-900">{i.tipoIntervento?.nome}</p>
                  <p className="text-sm text-gray-500">{i.tecnico?.nome} {i.tecnico?.cognome}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  i.stato === 'completato' ? 'bg-green-100 text-green-800' :
                  i.stato === 'in_corso' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {i.stato}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
