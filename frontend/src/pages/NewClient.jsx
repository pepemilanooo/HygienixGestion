import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsAPI, locationsAPI } from '../services/api'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewClient() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    ragioneSociale: '',
    tipo: 'azienda',
    piva: '',
    codiceFiscale: '',
    email: '',
    telefono: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    note: '',
    consigliere: '',
    telefonoConsigliere: '',
    // Prima sede (opzionale)
    aggiungiSede: false,
    nomeSede: '',
    sedeIndirizzo: '',
    sedeCitta: '',
    sedeCap: '',
    sedeProvincia: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ragioneSociale: formData.ragioneSociale.trim(),
        tipo: formData.tipo,
        piva: formData.piva.trim() || undefined,
        codiceFiscale: formData.codiceFiscale.trim() || undefined,
        email: formData.email.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        indirizzo: formData.indirizzo.trim() || undefined,
        citta: formData.citta.trim() || undefined,
        cap: formData.cap.trim() || undefined,
        provincia: formData.provincia.trim() || undefined,
        note: formData.note.trim() || undefined,
        consigliere: formData.consigliere.trim() || undefined,
        telefonoConsigliere: formData.telefonoConsigliere.trim() || undefined
      }
      const response = await clientsAPI.create(payload)
      const clientId = response.data.data.id

      if (formData.aggiungiSede && formData.nomeSede.trim()) {
        await locationsAPI.create({
          clientId,
          nomeSede: formData.nomeSede.trim(),
          indirizzo: formData.sedeIndirizzo.trim() || formData.indirizzo || formData.sedeIndirizzo || 'Da completare',
          citta: formData.sedeCitta.trim() || formData.citta || null,
          cap: formData.sedeCap.trim() || formData.cap || null,
          provincia: formData.sedeProvincia.trim() || formData.provincia || null
        })
      }

      toast.success('Cliente creato con successo!')
      navigate(`/clients/${clientId}`)
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Errore creazione cliente'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5 mr-1" /> Indietro
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Nuovo Cliente</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="label">Ragione sociale / Nome *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Es. Ristorante Da Giuseppe"
              value={formData.ragioneSociale}
              onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            >
              <option value="azienda">Azienda</option>
              <option value="privato">Privato</option>
              <option value="condominio">Condominio</option>
            </select>
          </div>
          <div>
            <label className="label">P.IVA</label>
            <input
              type="text"
              className="input"
              placeholder="IT12345678901"
              value={formData.piva}
              onChange={(e) => setFormData({ ...formData, piva: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Codice fiscale</label>
            <input
              type="text"
              className="input"
              value={formData.codiceFiscale}
              onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="info@esempio.it"
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
            <label className="label">Indirizzo</label>
            <input
              type="text"
              className="input"
              value={formData.indirizzo}
              onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Città</label>
            <input
              type="text"
              className="input"
              value={formData.citta}
              onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
            />
          </div>
          <div>
            <label className="label">CAP</label>
            <input
              type="text"
              className="input"
              value={formData.cap}
              onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Provincia</label>
            <input
              type="text"
              className="input"
              maxLength={2}
              placeholder="FI"
              value={formData.provincia}
              onChange={(e) => setFormData({ ...formData, provincia: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Note</label>
            <textarea
              rows={2}
              className="input"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Consigliere (opzionale)</label>
            <input
              type="text"
              className="input"
              placeholder="Nome del consigliere"
              value={formData.consigliere}
              onChange={(e) => setFormData({ ...formData, consigliere: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Telefono consigliere (opzionale)</label>
            <input
              type="text"
              className="input"
              placeholder="Numero di telefono del consigliere"
              value={formData.telefonoConsigliere}
              onChange={(e) => setFormData({ ...formData, telefonoConsigliere: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.aggiungiSede}
              onChange={(e) => setFormData({ ...formData, aggiungiSede: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="label mb-0">Aggiungi una sede ora</span>
          </label>
          {formData.aggiungiSede && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200">
              <div className="md:col-span-2">
                <label className="label">Nome sede *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Es. Sede principale"
                  value={formData.nomeSede}
                  onChange={(e) => setFormData({ ...formData, nomeSede: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Indirizzo sede</label>
                <input
                  type="text"
                  className="input"
                  value={formData.sedeIndirizzo}
                  onChange={(e) => setFormData({ ...formData, sedeIndirizzo: e.target.value })}
                  placeholder={formData.indirizzo || 'Stesso indirizzo cliente'}
                />
              </div>
              <div>
                <label className="label">Città</label>
                <input
                  type="text"
                  className="input"
                  value={formData.sedeCitta}
                  onChange={(e) => setFormData({ ...formData, sedeCitta: e.target.value })}
                />
              </div>
              <div>
                <label className="label">CAP / Provincia</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="CAP"
                    value={formData.sedeCap}
                    onChange={(e) => setFormData({ ...formData, sedeCap: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input w-20"
                    placeholder="PR"
                    value={formData.sedeProvincia}
                    onChange={(e) => setFormData({ ...formData, sedeProvincia: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Annulla
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Salvataggio...' : 'Crea Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
