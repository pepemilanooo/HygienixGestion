import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tecniciAPI } from '../services/api'
import { ArrowLeft, KeyRound, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewTechnician() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    telefono: ''
  })
  const [credenziali, setCredenziali] = useState(null)
  const [copiato, setCopiato] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nome.trim() || !formData.cognome.trim()) {
      toast.error('Nome e cognome obbligatori')
      return
    }
    if (formData.email.trim() && formData.password && formData.password.length < 6) {
      toast.error('Password almeno 6 caratteri')
      return
    }
    setLoading(true)
    setCredenziali(null)
    try {
      const payload = {
        nome: formData.nome.trim(),
        cognome: formData.cognome.trim(),
        telefono: formData.telefono.trim() || undefined
      }
      if (formData.email.trim()) payload.email = formData.email.trim()
      if (formData.password) payload.password = formData.password
      const res = await tecniciAPI.create(payload)
      const data = res.data?.data
      if (data?.generatedPassword) {
        setCredenziali({ email: data.email, password: data.generatedPassword })
        toast.success('Tecnico creato. Conserva le credenziali sotto.')
      } else {
        toast.success('Tecnico creato')
        navigate('/technicians')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore creazione tecnico')
    } finally {
      setLoading(false)
    }
  }

  const copiaCredenziali = () => {
    if (!credenziali) return
    const testo = `Accesso tecnico Hygienix\nEmail: ${credenziali.email}\nPassword: ${credenziali.password}`
    navigator.clipboard.writeText(testo).then(() => {
      setCopiato(true)
      toast.success('Credenziali copiate negli appunti')
      setTimeout(() => setCopiato(false), 2000)
    })
  }

  const vaiAllaLista = () => {
    setCredenziali(null)
    navigate('/technicians')
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Nuovo Tecnico</h1>

      <form onSubmit={handleSubmit} className="card space-y-6 max-w-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Nome *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Cognome *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.cognome}
              onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email (opzionale)</label>
            <input
              type="email"
              className="input"
              placeholder="Lascia vuoto per generare login automatico"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input
              type="text"
              className="input"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Password (opzionale)</label>
            <input
              type="password"
              minLength={6}
              className="input"
              placeholder="Lascia vuoto per generare una password automatica"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <p className="text-sm text-gray-500 mt-1">Se lasci email e password vuoti, verranno generate credenziali da dare al tecnico per l’accesso.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Annulla</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Salvataggio...' : 'Crea tecnico'}
          </button>
        </div>
      </form>

      {credenziali && (
        <div className="card max-w-lg mt-6 border-2 border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <KeyRound className="h-5 w-5 text-amber-600" />
            Credenziali di accesso per il tecnico
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Comunica queste credenziali al tecnico (la password non sarà più visibile dopo aver lasciato questa pagina).
          </p>
          <div className="space-y-2 font-mono text-sm bg-white p-4 rounded-lg border">
            <p><span className="text-gray-500">Email (login):</span> <strong>{credenziali.email}</strong></p>
            <p><span className="text-gray-500">Password:</span> <strong>{credenziali.password}</strong></p>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={copiaCredenziali} className="btn-secondary flex items-center gap-2">
              {copiato ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiato ? 'Copiato' : 'Copia credenziali'}
            </button>
            <button type="button" onClick={vaiAllaLista} className="btn-primary">
              Fine, vai alla lista tecnici
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
