'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { interventionsAPI } from '@/lib/api';
import Layout from '@/components/Layout';
import { Search, Plus, Filter, MapPin, Calendar, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function InterventiPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [interventions, setInterventions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadInterventions();
  }, [isAuthenticated, router, filters.status]);

  const loadInterventions = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (user?.ruolo === 'tecnico') params.technicianId = user.id;
      
      const response = await interventionsAPI.getAll(params);
      setInterventions(response.data.data);
    } catch (error) {
      toast.error('Errore nel caricamento degli interventi');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completato: 'bg-green-100 text-green-800',
      in_corso: 'bg-yellow-100 text-yellow-800',
      pianificato: 'bg-blue-100 text-blue-800',
      da_pianificare: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      completato: 'Completato',
      in_corso: 'In Corso',
      pianificato: 'Pianificato',
      da_pianificare: 'Da Pianificare',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.da_pianificare}`}>
        {labels[status] || status}
      </span>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Gestione Interventi</h1>
          {user?.ruolo !== 'tecnico' && (
            <Link href="/interventi/nuovo" className="btn-primary flex items-center justify-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Nuovo Intervento</span>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select 
            className="input w-auto"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tutti gli stati</option>
            <option value="pianificato">Pianificato</option>
            <option value="in_corso">In Corso</option>
            <option value="completato">Completato</option>
          </select>
        </div>

        {/* Interventions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y">
            {interventions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nessun intervento trovato</div>
            ) : (
              interventions.map((intervention) => (
                <div key={intervention.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(intervention.stato)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {intervention.cliente_nome}
                        </h3>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {intervention.sede_nome}
                      </p>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {intervention.data_programmata && format(
                            new Date(intervention.data_programmata),
                            'dd MMM yyyy HH:mm',
                            { locale: it }
                          )}
                        </span>
                        {intervention.tecnico_nome && (
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {intervention.tecnico_nome} {intervention.tecnico_cognome}
                          </span>
                        )}
                      </div>
                      
                      {intervention.tipo_infestante && (
                        <p className="mt-2 text-sm text-gray-600">
                          <strong>Infestante:</strong> {intervention.tipo_infestante}
                        </p>
                      )}
                    </div>
                    
                    <Link 
                      href={`/interventi/${intervention.id}`}
                      className="ml-4 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      Dettagli
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
