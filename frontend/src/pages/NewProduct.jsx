import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prodottiAPI } from '../services/api'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewProduct() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nomeCommerciale: '',
    principioAttivo: '',
    numeroRegistro: '',
    categoria: 'insetticida',
    unitaMisura: 'ml',
    quantitaDisponibile: 0,
    quantitaMinima: 0,
    schedaSicurezzaUrl: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nomeCommerciale.trim()) {
      toast.error('Nome commerciale obbligatorio')
      return
    }
    setLoading(true)
    try {
      await prodottiAPI.create({
        nomeCommerciale: formData.nomeCommerciale.trim(),
        principioAttivo: formData.principioAttivo.trim() || null,
        numeroRegistro: formData.numeroRegistro.trim() || null,
        categoria: formData.categoria || null,
        unitaMisura: formData.unitaMisura,
        quantitaDisponibile: parseFloat(formData.quantitaDisponibile) || 0,
        quantitaMinima: parseFloat(formData.quantitaMinima) || 0,
        schedaSicurezzaUrl: formData.schedaSicurezzaUrl.trim() || null
      })
      toast.success('Prodotto creato')
      navigate('/products')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore creazione prodotto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Nuovo Prodotto</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Nome commerciale *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Es. Blattox"
              value={formData.nomeCommerciale}
              onChange={(e) => setFormData({ ...formData, nomeCommerciale: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Principio attivo</label>
            <input
              type="text"
              className="input"
              placeholder="Es. Cipermetrina"
              value={formData.principioAttivo}
              onChange={(e) => setFormData({ ...formData, principioAttivo: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Numero registro</label>
            <input
              type="text"
              className="input"
              value={formData.numeroRegistro}
              onChange={(e) => setFormData({ ...formData, numeroRegistro: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            >
              <option value="insetticida">Insetticida</option>
              <option value="rodenticida">Rodenticida</option>
              <option value="disinfettante">Disinfettante</option>
              <option value="altro">Altro</option>
            </select>
          </div>
          <div>
            <label className="label">Unità di misura *</label>
            <select
              className="input"
              value={formData.unitaMisura}
              onChange={(e) => setFormData({ ...formData, unitaMisura: e.target.value })}
            >
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="l">l</option>
              <option value="pz">pz</option>
            </select>
          </div>
          <div>
            <label className="label">Quantità disponibile</label>
            <input
              type="number"
              min={0}
              step={1}
              className="input"
              value={formData.quantitaDisponibile}
              onChange={(e) => setFormData({ ...formData, quantitaDisponibile: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Quantità minima (soglia)</label>
            <input
              type="number"
              min={0}
              step={1}
              className="input"
              value={formData.quantitaMinima}
              onChange={(e) => setFormData({ ...formData, quantitaMinima: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">URL scheda sicurezza (opzionale)</label>
            <input
              type="text"
              className="input"
              placeholder="https://..."
              value={formData.schedaSicurezzaUrl}
              onChange={(e) => setFormData({ ...formData, schedaSicurezzaUrl: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Annulla</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Salvataggio...' : 'Crea Prodotto'}
          </button>
        </div>
      </form>
    </div>
  )
}
