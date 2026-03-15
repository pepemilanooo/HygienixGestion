'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ArrowRight, MapPin, User } from 'lucide-react';

export default function RecentInterventions({ interventions }) {
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Interventi Recenti</h2>
        <Link 
          href="/interventi"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
        >
          Vedi tutti
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="divide-y">
        {interventions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nessun intervento recente
          </div>
        ) : (
          interventions.map((intervention) => (
            <div key={intervention.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {intervention.cliente_nome || 'Cliente sconosciuto'}
                    </p>
                    {getStatusBadge(intervention.stato)}
                  </div>
                  
                  <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {intervention.sede_nome || 'Sede non specificata'}
                    </span>
                    {intervention.tecnico_nome && (
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {intervention.tecnico_nome} {intervention.tecnico_cognome}
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-1 text-xs text-gray-400">
                    {intervention.data_programmata && format(
                      new Date(intervention.data_programmata),
                      'dd MMMM yyyy HH:mm',
                      { locale: it }
                    )}
                  </p>
                </div>
                
                <Link
                  href={`/interventi/${intervention.id}`}
                  className="ml-4 text-primary-600 hover:text-primary-700"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
