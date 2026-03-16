import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interventionsAPI, uploadAPI, prodottiAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import SignaturePad from '../components/SignaturePad'
import { MapPin, Calendar, User, Clock, CheckCircle, ArrowLeft, PenTool, Package, Phone, Lock, FileText, ClipboardList } from 'lucide-react'
import { SopralluogoForm } from '../components/sopralluoghi'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'

export default function InterventionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [intervention, setIntervention] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [firmaTecnicoUrl, setFirmaTecnicoUrl] = useState(null)
  const [firmaClienteUrl, setFirmaClienteUrl] = useState(null)
  const [showFirmaTecnico, setShowFirmaTecnico] = useState(false)
  const [showFirmaCliente, setShowFirmaCliente] = useState(false)
  const [noteTecnico, setNoteTecnico] = useState('')
  const [risultato, setRisultato] = useState('positivo')
  const [prodottiDisponibili, setProdottiDisponibili] = useState([])
  const [addingProdotto, setAddingProdotto] = useState(false)
  const [addProdottoId, setAddProdottoId] = useState('')
  const [addQuantita, setAddQuantita] = useState('')
  const [rigenerandoReport, setRigenerandoReport] = useState(false)
  const [reportDaScaricare, setReportDaScaricare] = useState(null)
  const [showSopralluogo, setShowSopralluogo] = useState(false)
  const [tipoSopralluogo, setTipoSopralluogo] = useState('')

  useEffect(() => {
    loadIntervention()
  }, [id])

  useEffect(() => {
    if (intervention?.tecnicoId === user?.id && intervention?.stato !== 'completato') {
      prodottiAPI.getAll().then(r => setProdottiDisponibili(r.data.data || [])).catch(() => {})
    }
  }, [intervention?.tecnicoId, intervention?.stato, user?.id])

  const loadIntervention = async () => {
    try {
      const response = await interventionsAPI.getById(id)
      const data = response.data.data
      setIntervention(data)
      if (data?.firmaTecnicoUrl) setFirmaTecnicoUrl(data.firmaTecnicoUrl)
      if (data?.firmaClienteUrl) setFirmaClienteUrl(data.firmaClienteUrl)
    } catch (error) {
      toast.error('Intervento non trovato')
      navigate('/interventions')
    } finally {
      setLoading(false)
    }
  }

  const scaricaReportPdf = (urlPath) => {
    const url = `${API_BASE}${urlPath}`
    fetch(url, { mode: 'cors' })
      .then((r) => {
        if (!r.ok) throw new Error('Download fallito')
        return r.blob()
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `report-intervento-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(blobUrl)
      })
      .catch(() => {
        window.open(url, '_blank')
        toast('Apertura in nuova scheda. Puoi salvare il PDF da lì.', { duration: 4000 })
      })
  }

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalizzazione non supportata')
      return
    }

    setCheckingIn(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await interventionsAPI.checkIn(
            id,
            position.coords.latitude,
            position.coords.longitude
          )
          toast.success('Check-in effettuato!')
          loadIntervention()
        } catch (error) {
          toast.error(error.response?.data?.message || 'Errore check-in')
        } finally {
          setCheckingIn(false)
        }
      },
      () => {
        toast.error('Impossibile ottenere la posizione')
        setCheckingIn(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleFirmaConfirm = async (blob, tipo) => {
    try {
      const file = new File([blob], `firma-${tipo}.png`, { type: 'image/png' })
      const res = await uploadAPI.firma(file)
      const url = res.data.data?.url
      if (!url) throw new Error('URL non restituito')
      if (tipo === 'tecnico') {
        setFirmaTecnicoUrl(url)
        setShowFirmaTecnico(false)
        toast.success('Firma in loco registrata')
      } else {
        setFirmaClienteUrl(url)
        setShowFirmaCliente(false)
        toast.success('Firma cliente registrata')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore upload firma')
    }
  }

  const handleAddProdotto = async (e) => {
    e.preventDefault()
    const qty = parseFloat(addQuantita)
    if (!addProdottoId || !(qty > 0)) {
      toast.error('Seleziona un prodotto e inserisci la quantità')
      return
    }
    setAddingProdotto(true)
    try {
      await interventionsAPI.addProdotto(id, {
        prodottoId: addProdottoId,
        quantitaUsata: qty
      })
      toast.success('Prodotto aggiunto e scaricato da magazzino')
      setAddProdottoId('')
      setAddQuantita('')
      loadIntervention()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore aggiunta prodotto')
    } finally {
      setAddingProdotto(false)
    }
  }

  const handleRemoveProdotto = async (rigaId) => {
    try {
      await interventionsAPI.removeProdotto(id, rigaId)
      toast.success('Prodotto rimosso e rientrato in magazzino')
      loadIntervention()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore rimozione')
    }
  }

  const handleComplete = async () => {
    if (!firmaTecnicoUrl) {
      toast.error('Firma in loco obbligatoria prima di chiudere l\'intervento.')
      return
    }
    setCompleting(true)
    try {
      const res = await interventionsAPI.complete(id, {
        noteTecnico: noteTecnico.trim() || null,
        risultato,
        firmaTecnicoUrl,
        firmaClienteUrl: firmaClienteUrl || null
      })
      const reportGenerato = res.data?.reportGenerato
      const reportPdfUrl = res.data?.reportPdfUrl ?? res.data?.data?.reportPdfUrl ?? null
      const msg = res.data?.message || 'Intervento completato!'
      toast.success(msg)
      if (reportGenerato === false) {
        toast(msg.includes('Report non generato') ? msg : 'Report PDF non generato. Un admin può generarlo da questa pagina con "Genera report".', { icon: '⚠️', duration: 6000 })
      }
      loadIntervention()
      if (reportPdfUrl) {
        setReportDaScaricare(reportPdfUrl)
        setTimeout(() => {
          if (window.confirm('Report PDF generato. Vuoi scaricarlo ora?')) {
            scaricaReportPdf(reportPdfUrl)
          }
        }, 400)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Errore completamento')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const isAssignedToMe = intervention?.tecnicoId === user?.id
  const canCheckIn = isAssignedToMe && intervention?.stato === 'pianificato'
  const canComplete = isAssignedToMe && intervention?.stato === 'in_corso'
  const hasFirmaTecnico = !!firmaTecnicoUrl
  const canCloseIntervention = canComplete && hasFirmaTecnico
  const hasProdotti = (intervention?.prodotti?.length || 0) > 0
  const showLockedAddress = isAssignedToMe && intervention?.stato !== 'completato' && !hasProdotti
  const canAddProdotti = isAssignedToMe && intervention?.stato !== 'completato'

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>

      {reportDaScaricare && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <p className="text-green-800 font-medium flex items-center gap-2">
            <FileText className="h-5 w-5 shrink-0" />
            Report PDF generato. Scaricalo qui sotto.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => { scaricaReportPdf(reportDaScaricare); setReportDaScaricare(null) }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Scarica report
            </button>
            <a
              href={`${API_BASE}${reportDaScaricare}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white border border-green-300 text-green-800 rounded-lg font-medium hover:bg-green-100"
            >
              Apri in nuova scheda
            </a>
            <button
              type="button"
              onClick={() => setReportDaScaricare(null)}
              className="p-2 text-green-700 hover:bg-green-100 rounded"
              title="Chiudi"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {intervention?.client?.ragioneSociale}
            </h1>
            <p className="text-primary-600 font-medium mt-1">
              {intervention?.tipoIntervento?.nome}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            intervention?.stato === 'completato' ? 'bg-green-100 text-green-800' :
            intervention?.stato === 'in_corso' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {intervention?.stato}
          </span>
          {intervention?.stato === 'completato' && intervention?.reportPdfUrl && (
            <a
              href={`${API_BASE}${intervention.reportPdfUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium hover:bg-indigo-200"
            >
              <FileText className="h-4 w-4" /> Scarica report PDF
            </a>
          )}
          {intervention?.stato === 'completato' && user?.role === 'admin' && (
            <button
              type="button"
              disabled={rigenerandoReport}
              onClick={async () => {
                setRigenerandoReport(true)
                try {
                  await interventionsAPI.rigeneraReport(id)
                  toast.success('Report PDF rigenerato e assegnato al cliente.')
                  loadIntervention()
                } catch (e) {
                  toast.error(e.response?.data?.message || 'Errore rigenerazione report')
                } finally {
                  setRigenerandoReport(false)
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" /> {intervention?.reportPdfUrl ? 'Rigenera report' : 'Genera report'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-3">
            <p className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2 text-gray-400" />
              {intervention?.location?.nomeSede}
            </p>
            {showLockedAddress ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="flex items-center text-amber-800 font-medium">
                  <Lock className="h-5 w-5 mr-2" />
                  Indirizzo e telefono nascosti
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Seleziona i prodotti che utilizzerai per questo intervento per sbloccare indirizzo e numero di telefono del cliente.
                </p>
              </div>
            ) : (
              <>
                {intervention?.location && (
                  <p className="flex items-start text-gray-600">
                    <MapPin className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                    <span>
                      {intervention.location.indirizzo}
                      {intervention.location.citta && <>, {intervention.location.citta}</>}
                      {intervention.location.cap && <> {intervention.location.cap}</>}
                      {intervention.location.provincia && <> ({intervention.location.provincia})</>}
                    </span>
                  </p>
                )}
                {intervention?.client?.telefono && (
                  <p className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 mr-2 text-gray-400" />
                    <a href={`tel:${intervention.client.telefono}`} className="text-primary-600 hover:underline">{intervention.client.telefono}</a>
                  </p>
                )}
              </>
            )}
            <p className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              {intervention?.dataProgrammata && format(new Date(intervention.dataProgrammata), 'dd MMMM yyyy HH:mm', { locale: it })}
            </p>
            <p className="flex items-center text-gray-600">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              {intervention?.tecnico?.nome} {intervention?.tecnico?.cognome}
            </p>
          </div>

          {/* Sezione Prodotti per tecnico: seleziona prodotti per sbloccare indirizzo e poter aggiungere fino a chiusura */}
          {canAddProdotti && (
            <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Prodotti da utilizzare
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Seleziona i prodotti che userai per questo intervento. Verranno scaricati dal magazzino. Dopo aver aggiunto almeno un prodotto si sbloccano indirizzo e telefono cliente. Puoi aggiungere altri prodotti fino alla chiusura.
              </p>
              <form onSubmit={handleAddProdotto} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px]">
                  <label className="label text-xs">Prodotto</label>
                  <select
                    className="input py-2"
                    value={addProdottoId}
                    onChange={(e) => setAddProdottoId(e.target.value)}
                  >
                    <option value="">Seleziona...</option>
                    {prodottiDisponibili.filter(p => p.quantitaDisponibile > 0).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nomeCommerciale} (disp. {p.quantitaDisponibile} {p.unitaMisura})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="label text-xs">Quantità</label>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    className="input py-2"
                    placeholder="Qtà"
                    value={addQuantita}
                    onChange={(e) => setAddQuantita(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={addingProdotto} className="btn-primary py-2">
                  {addingProdotto ? 'Aggiunta...' : 'Aggiungi'}
                </button>
              </form>
              {hasProdotti && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Prodotti aggiunti a questo intervento:</p>
                  <ul className="space-y-1">
                    {intervention.prodotti.map((p) => (
                      <li key={p.id} className="flex justify-between items-center text-sm">
                        <span>{p.prodotto.nomeCommerciale} — {p.quantitaUsata} {p.unitaMisura}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProdotto(p.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Rimuovi
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {intervention?.checkInTime && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Check-in</h3>
              <p className="text-sm text-gray-600">
                <Clock className="inline h-4 w-4 mr-1" />
                {format(new Date(intervention.checkInTime), 'HH:mm')}
              </p>
              {intervention.checkInLat && (
                <p className="text-xs text-gray-500 mt-1">
                  GPS: {intervention.checkInLat.toFixed(5)}, {intervention.checkInLng?.toFixed(5)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Firma in loco e firma cliente (tecnico, intervento in corso) */}
        {isAssignedToMe && intervention?.stato === 'in_corso' && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <h3 className="font-semibold text-gray-900">Firme</h3>
            <p className="text-sm text-gray-600">
              La <strong>firma in loco</strong> è obbligatoria per chiudere l&apos;intervento. La firma del cliente è opzionale.
            </p>
            <div className="flex flex-wrap gap-3">
              {!showFirmaTecnico && !hasFirmaTecnico && (
                <button type="button" onClick={() => setShowFirmaTecnico(true)} className="btn-primary flex items-center gap-2">
                  <PenTool className="h-4 w-4" /> Firma in loco (obbligatoria)
                </button>
              )}
              {hasFirmaTecnico && (
                <div className="flex items-center gap-2">
                  <img src={`${API_BASE}${firmaTecnicoUrl}`} alt="Firma tecnico" className="h-12 border rounded" />
                  <span className="text-sm text-green-600">Firma in loco registrata</span>
                </div>
              )}
              {!showFirmaCliente && !firmaClienteUrl && (
                <button type="button" onClick={() => setShowFirmaCliente(true)} className="btn-secondary flex items-center gap-2">
                  <PenTool className="h-4 w-4" /> Firma cliente (opzionale)
                </button>
              )}
              {firmaClienteUrl && (
                <div className="flex items-center gap-2">
                  <img src={`${API_BASE}${firmaClienteUrl}`} alt="Firma cliente" className="h-12 border rounded" />
                  <span className="text-sm text-green-600">Firma cliente registrata</span>
                </div>
              )}
            </div>
            {showFirmaTecnico && (
              <SignaturePad
                title="Firma in loco (tecnico)"
                onConfirm={(blob) => handleFirmaConfirm(blob, 'tecnico')}
                onCancel={() => setShowFirmaTecnico(false)}
              />
            )}
            {showFirmaCliente && (
              <SignaturePad
                title="Firma del cliente"
                onConfirm={(blob) => handleFirmaConfirm(blob, 'cliente')}
                onCancel={() => setShowFirmaCliente(false)}
              />
            )}
          </div>
        )}

        {/* Note e risultato prima di completare */}
        {canComplete && (
          <div className="mt-4 space-y-3">
            <label className="label">Note tecnico (opzionale)</label>
            <textarea
              rows={2}
              className="input"
              value={noteTecnico}
              onChange={(e) => setNoteTecnico(e.target.value)}
              placeholder="Note sull'intervento..."
            />
            <label className="label">Risultato</label>
            <select className="input max-w-xs" value={risultato} onChange={(e) => setRisultato(e.target.value)}>
              <option value="positivo">Positivo</option>
              <option value="negativo">Negativo</option>
              <option value="parziale">Parziale</option>
            </select>
          </div>
        )}

        {/* Actions for tecnico */}
        {isAssignedToMe && (
          <div className="flex flex-wrap gap-3 mt-6">
            {canCheckIn && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="btn-primary"
              >
                {checkingIn ? 'Attendere...' : '📍 Check-in GPS'}
              </button>
            )}
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={!canCloseIntervention || completing}
                title={!hasFirmaTecnico ? 'Prima firma in loco per chiudere l\'intervento' : ''}
                className="btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completing ? 'Salvataggio...' : (
                  <>
                    <CheckCircle className="inline h-4 w-4 mr-1" />
                    {hasFirmaTecnico ? 'Chiudi intervento' : 'Firma in loco obbligatoria per chiudere'}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Photos */}
      {intervention?.foto?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Foto</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {intervention.foto.map((foto, idx) => (
              <img
                key={idx}
                src={foto.fotoUrl}
                alt={`Foto ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Products (sintesi per admin o quando intervento completato) */}
      {intervention?.prodotti?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Prodotti utilizzati</h2>
          <div className="divide-y">
            {intervention.prodotti.map((p) => (
              <div key={p.id} className="py-3 flex justify-between items-center">
                <span>{p.prodotto.nomeCommerciale}</span>
                <span className="text-gray-600">{p.quantitaUsata} {p.unitaMisura}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sopralluogo Section */}
      {isAssignedToMe && intervention?.stato !== 'completato' && (
        <div className="card">
          {!showSopralluogo ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Sopralluogo</h2>
              </div>
              
              {intervention?.sopralluogoData ? (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-700 font-medium">
                    ✓ Sopralluogo completato: {intervention.sopralluogoData.tipoSopralluogo?.toUpperCase()}
                  </p>
                  <button 
                    onClick={() => {
                      setTipoSopralluogo(intervention.sopralluogoData.tipoSopralluogo)
                      setShowSopralluogo(true)
                    }}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Modifica sopralluogo
                  </button>
                </div>
              ) : (
                <p className="text-gray-600 mb-4">Seleziona il tipo di sopralluogo da effettuare:</p>
              )}

              {!intervention?.sopralluogoData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'zanzare', label: 'Zanzare', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:border-blue-400' },
                    { value: 'ratti', label: 'Ratti', color: 'green', bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:border-green-400' },
                    { value: 'blatte', label: 'Blatte', color: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', hover: 'hover:border-yellow-400' }
                  ].map(tipo => (
                    <button
                      key={tipo.value}
                      onClick={() => {
                        setTipoSopralluogo(tipo.value)
                        setShowSopralluogo(true)
                      }}
                      className={`p-4 rounded-lg border-2 ${tipo.border} ${tipo.bg} ${tipo.hover} transition-colors text-center`}
                    >
                      <span className={`font-semibold text-${tipo.color}-700`}>{tipo.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Sopralluogo - {tipoSopralluogo.toUpperCase()}</h2>
                <button 
                  onClick={() => setShowSopralluogo(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  ✕ Chiudi
                </button>
              </div>
              <SopralluogoForm 
                interventionId={id}
                tipoSopralluogo={tipoSopralluogo}
                onComplete={() => {
                  setShowSopralluogo(false)
                  loadIntervention()
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
