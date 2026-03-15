import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { prodottiAPI } from '../services/api'
import { Package, AlertTriangle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prodotto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giacenza</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-900">{p.nomeCommerciale}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 capitalize">{p.categoria}</td>
                <td className="px-6 py-4 text-gray-900">
                  {p.quantitaDisponibile} {p.unitaMisura}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
