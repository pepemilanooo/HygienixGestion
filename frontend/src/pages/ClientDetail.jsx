import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { clientsAPI } from '../services/api'
import { ArrowLeft, Edit2, Trash2, Download, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteConfirmDouble, setDeleteConfirmDouble] = useState(false)

  useEffect(() => {
    loadClient()
  }, [id])

  const loadClient = async () => {
    try {
      const response = await clientsAPI.getById(id)
      setClient(response.data.data)
      setFormData(response.data.data)
    } catch (error) {
      toast.error('Errore caricamento cliente')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      const response = await clientsAPI.update(id, formData)
      setClient(response.data.data)
      setEditing(false)
      toast.success('Cliente aggiornato con successo')
    } catch (error) {
      toast.error('Errore aggiornamento cliente')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmDouble) {
      setDeleteConfirm(true)
      return
    }
    
    try {
      await clientsAPI.delete(id)
      toast.success('Cliente eliminato con successo')
      navigate('/clients')
    } catch (error) {
      toast.error('Errore eliminazione cliente')
    }
  }

  const downloadDocument = (url) => {
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!client) {
    return <div className="text-center text-gray-500">Cliente non trovato</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Torna ai clienti</span>
        </button>
        <div className="flex space-x-2">
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Edit2 className="h-5 w-5" />
                <span>Modifica</span>
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="btn-danger flex items-center space-x-2"
              >
                <Trash2 className="h-5 w-5" />
                <span>Elimina</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dati Cliente */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Dati Anagrafici</h2>
        
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale *</label>
                <input
                  type="text"
                  name="ragioneSociale"
                  value={formData.ragioneSociale || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo || 'azienda'}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="azienda">Azienda</option>
                  <option value="privato">Privato</option>
                  <option value="condominio">Condominio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">P.IVA</label>
                <input
                  type="text"
                  name="piva"
                  value={formData.piva || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                <input
                  type="text"
                  name="codiceFiscale"
                  value={formData.codiceFiscale || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                <input
                  type="text"
                  name="indirizzo"
                  value={formData.indirizzo || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                <input
                  type="text"
                  name="citta"
                  value={formData.citta || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                <input
                  type="text"
                  name="cap"
                  value={formData.cap || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  name="provincia"
                  value={formData.provincia || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  name="note"
                  value={formData.note || ''}
                  onChange={handleInputChange}
                  className="input w-full"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleSave} className="btn-primary">Salva</button>
              <button onClick={() => { setEditing(false); setFormData(client) }} className="btn-secondary">Annulla</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Ragione Sociale</p>
              <p className="font-semibold">{client.ragioneSociale}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-semibold">{client.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">P.IVA</p>
              <p className="font-semibold">{client.piva || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Codice Fiscale</p>
              <p className="font-semibold">{client.codiceFiscale || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{client.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefono</p>
              <p className="font-semibold">{client.telefono || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Indirizzo</p>
              <p className="font-semibold">{client.indirizzo || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Città</p>
              <p className="font-semibold">{client.citta || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CAP</p>
              <p className="font-semibold">{client.cap || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Provincia</p>
              <p className="font-semibold">{client.provincia || '-'}</p>
            </div>
            {client.note && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Note</p>
                <p className="font-semibold">{client.note}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documenti */}
      {client.documenti && client.documenti.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Documenti e Report</h2>
          <div className="space-y-2">
            {client.documenti.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold">{doc.nome}</p>
                  <p className="text-sm text-gray-500">{new Date(doc.dataDocumento || doc.createdAt).toLocaleDateString('it-IT')}</p>
                </div>
                <button
                  onClick={() => downloadDocument(doc.url)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Scarica</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold mb-4">Elimina Cliente</h3>
            {!deleteConfirmDouble ? (
              <>
                <p className="text-gray-600 mb-6">Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.</p>
                <div className="flex space-x-2">
                  <button onClick={() => setDeleteConfirm(false)} className="btn-secondary flex-1">Annulla</button>
                  <button onClick={handleDelete} className="btn-danger flex-1">Elimina</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">Conferma di nuovo per eliminare definitivamente il cliente.</p>
                <div className="flex space-x-2">
                  <button onClick={() => { setDeleteConfirm(false); setDeleteConfirmDouble(false) }} className="btn-secondary flex-1">Annulla</button>
                  <button onClick={handleDelete} className="btn-danger flex-1">Elimina Definitivamente</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}