import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { prodottiAPI } from '../services/api'
import { Package, AlertTriangle, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await prodottiAPI.getAll()
      setProducts(response.data.data || [])
    } catch (error) {
      toast.error('Errore caricamento prodotti')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setEditForm({
      nomeCommerciale: product.nomeCommerciale || '',
      principioAttivo: product.principioAttivo || '',
      categoria: product.categoria || '',
      unitaMisura: product.unitaMisura || '',
      quantitaDisponibile: product.quantitaDisponibile || 0,
      quantitaMinima: product.quantitaMinima || 0,
    })
  }

  const handleSaveEdit = async (id) => {
    try {
      await prodottiAPI.update(id, editForm)
      toast.success('Prodotto aggiornato')
      setEditingId(null)
      loadProducts()
    } catch (error) {
      toast.error('Errore aggiornamento prodotto')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleDelete = async (id) => {
    try {
      await prodottiAPI.delete(id)
      toast.success('Prodotto eliminato')
      setDeleteConfirm(null)
      loadProducts()
    } catch (error) {
      toast.error('Errore eliminazione prodotto')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Prodotti</h1>
        <Link to="/products/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" /> Nuovo Prodotto
        </Link>
      </div>

      {/* Modal Conferma Eliminazione */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Conferma eliminazione</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare il prodotto <strong>{deleteConfirm.nomeCommerciale}</strong>?
              <br />L'azione non è reversibile.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Annulla
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prodotto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giacenza</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                {editingId === p.id ? (
                  // Modalità Modifica
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="nomeCommerciale"
                        value={editForm.nomeCommerciale}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Nome commerciale"
                      />
                      <input
                        type="text"
                        name="principioAttivo"
                        value={editForm.principioAttivo}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border rounded text-sm mt-1"
                        placeholder="Principio attivo"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        name="categoria"
                        value={editForm.categoria}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="">Seleziona...</option>
                        <option value="insetticida">Insetticida</option>
                        <option value="rodenticida">Rodenticida</option>
                        <option value="disinfettante">Disinfettante</option>
                        <option value="trappola">Trappola</option>
                        <option value="esche">Esche</option>
                        <option value="altro">Altro</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          name="quantitaDisponibile"
                          value={editForm.quantitaDisponibile}
                          onChange={handleInputChange}
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="text"
                          name="unitaMisura"
                          value={editForm.unitaMisura}
                          onChange={handleInputChange}
                          className="w-20 px-2 py-1 border rounded text-sm"
                          placeholder="Unità"
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min: <input
                          type="number"
                          name="quantitaMinima"
                          value={editForm.quantitaMinima}
                          onChange={handleInputChange}
                          className="w-16 px-1 py-0.5 border rounded"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">In modifica...</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSaveEdit(p.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Salva"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800"
                          title="Annulla"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // Modalità Visualizzazione
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <span className="font-medium text-gray-900 block">{p.nomeCommerciale}</span>
                          {p.principioAttivo && (
                            <span className="text-xs text-gray-500">{p.principioAttivo}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{p.categoria}</td>
                    <td className="px-6 py-4 text-gray-900">
                      {p.quantitaDisponibile} {p.unitaMisura}
                      <div className="text-xs text-gray-500">
                        Min: {p.quantitaMinima}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.quantitaDisponibile <= p.quantitaMinima ? (
                        <span className="flex items-center text-red-600 text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" /> Sotto scorta
                        </span>
                      ) : (
                        <span className="text-green-600 text-sm">✓ Disponibile</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(p)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Modifica"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(p)}
                          className="text-red-600 hover:text-red-800"
                          title="Elimina"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
