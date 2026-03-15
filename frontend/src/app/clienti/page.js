'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { clientsAPI } from '@/lib/api';
import Layout from '@/components/Layout';
import { Search, Plus, Building2, MapPin, Phone, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ClientiPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadClients();
  }, [isAuthenticated, router]);

  const loadClients = async () => {
    try {
      const response = await clientsAPI.getAll({ search: searchTerm });
      setClients(response.data.data);
    } catch (error) {
      toast.error('Errore nel caricamento dei clienti');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadClients();
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Gestione Clienti</h1>
          <Link
            href="/clienti/nuovo"
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nuovo Cliente</span>
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per ragione sociale, email, P.IVA..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Cerca
          </button>
        </form>

        {/* Clients List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y">
            {clients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessun cliente trovato
              </div>
            ) : (
              clients.map((client) => (
                <div 
                  key={client.id} 
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-primary-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {client.ragione_sociale}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.attivo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.attivo ? 'Attivo' : 'Inattivo'}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        {client.email && (
                          <span>{client.email}</span>
                        )}
                        {client.telefono && (
                          <span className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {client.telefono}
                          </span>
                        )}
                        {client.piva && (
                          <span>P.IVA: {client.piva}</span>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {client.numero_sedi || 0} sedi
                        <span className="mx-2">•</span>
                        {client.numero_interventi || 0} interventi
                      </div>
                    </div>
                    
                    <Link
                      href={`/clienti/${client.id}`}
                      className="ml-4 p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
