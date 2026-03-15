'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { interventionsAPI } from '@/lib/api';
import Layout from '@/components/Layout';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CalendarioPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [interventions, setInterventions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadInterventions();
  }, [isAuthenticated, router, currentMonth]);

  const loadInterventions = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const params = {
        fromDate: start.toISOString(),
        toDate: end.toISOString(),
      };
      
      if (user?.ruolo === 'tecnico') {
        params.technicianId = user.id;
      }
      
      const response = await interventionsAPI.getAll(params);
      setInterventions(response.data.data);
    } catch (error) {
      console.error('Error loading interventions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getInterventionsForDay = (day) => {
    return interventions.filter(intervention => 
      intervention.data_programmata && 
      isSameDay(new Date(intervention.data_programmata), day)
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendario Interventi</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </span>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
            
            {days.map((day, idx) => {
              const dayInterventions = getInterventionsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={day.toISOString()}
                  className={`bg-white min-h-24 p-2 ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayInterventions.slice(0, 3).map(intervention => (
                      <Link
                        key={intervention.id}
                        href={`/interventi/${intervention.id}`}
                        className={`block text-xs p-1 rounded truncate ${
                          intervention.stato === 'completato' ? 'bg-green-100 text-green-800' :
                          intervention.stato === 'in_corso' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {format(new Date(intervention.data_programmata), 'HH:mm')} - {intervention.cliente_nome}
                      </Link>
                    ))}
                    {dayInterventions.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayInterventions.length - 3} altri
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
