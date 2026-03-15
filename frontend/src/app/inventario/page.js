'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { productsAPI } from '@/lib/api';
import Layout from '@/components/Layout';
import { Search, Plus, AlertTriangle, Package, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function InventarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const showLowStock = searchParams.get('lowStock') === 'true';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProducts();
  }, [isAuthenticated, router, showLowStock]);

  const loadProducts = async () => {
    try {
      const params = { search: searchTerm };
      if (showLowStock) params.lowStock = true;
      
      const response = await productsAPI.getAll(params);
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Errore nel caricamento dei prodotti');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    
    try {
      await productsAPI.delete(id);
      toast.success('Prodotto eliminato');
      loadProducts();
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario Prodotti</h1>
            {showLowStock && (
              <p className="text-red-600 flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Visualizzazione prodotti sotto scorta minima
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/inventario" className={`btn-secondary ${!showLowStock ? 'bg-primary-100' : ''}`}>
              Tutti
            </Link>
            <Link href="/inventario?lowStock=true" className={`btn-secondary ${showLowStock ? 'bg-red-100' : ''}`}>
              Sotto Scorta
            </Link>
            <Link href="/inventario/nuovo" className="btn-primary flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Nuovo</span>
            </Link>
          </div>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); loadProducts(); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca prodotto..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Cerca</button>
        </form>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prodotto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponibilità</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scorta Minima</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Nessun prodotto trovato
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.nome_commerciale}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.principio_attivo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.categoria}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          product.sotto_scorta ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {product.quantita_disponibile} {product.unita_misura}
                          {product.sotto_scorta && (
                            <AlertTriangle className="inline h-4 w-4 ml-1" />
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.quantita_minima} {product.unita_misura}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            href={`/inventario/${product.id}/modifica`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
