'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { analyticsAPI } from '@/lib/api';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import RecentInterventions from '@/components/RecentInterventions';
import { 
  Users, 
  ClipboardList, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      toast.error('Errore nel caricamento dei dati');
      console.error(error);
    } finally {
      setIsLoading(false);
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

  const { overview, recentInterventions, statusDistribution } = dashboardData || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Benvenuto, {user?.nome || 'Utente'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Ecco la panoramica della tua attività oggi
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Clienti Totali"
            value={overview?.clienti?.totali || 0}
            icon={<Users className="h-6 w-6 text-blue-500" />}
            trend={overview?.clienti?.nuovi_30gg || 0}
            trendLabel="nuovi questo mese"
          />
          <StatCard
            title="Interventi Totali"
            value={overview?.interventi?.totali || 0}
            icon={<ClipboardList className="h-6 w-6 text-purple-500" />}
            trend={overview?.interventi?.completati || 0}
            trendLabel="completati"
          />
          <StatCard
            title="In Corso"
            value={overview?.interventi?.in_corso || 0}
            icon={<TrendingUp className="h-6 w-6 text-yellow-500" />}
            color="yellow"
          />
          <StatCard
            title="Scorte Basse"
            value={overview?.prodotti?.sotto_scorta || 0}
            icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
            color="red"
            link="/inventario?lowStock=true"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Interventions */}
          <RecentInterventions 
            interventions={recentInterventions || []} 
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => router.push('/interventi/nuovo')}
                className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-center"
              >
                <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-primary-700">
                  Nuovo Intervento
                </span>
              </button>
              <button 
                onClick={() => router.push('/clienti/nuovo')}
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
              >
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-green-700">
                  Nuovo Cliente
                </span>
              </button>
              <button 
                onClick={() => router.push('/mappa')}
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
              >
                <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-blue-700">
                  Mappa Interventi
                </span>
              </button>
              <button 
                onClick={() => router.push('/analytics')}
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
              >
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-purple-700">
                  Reportistica
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        {statusDistribution && statusDistribution.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Distribuzione Interventi per Stato</h2>
            <div className="flex flex-wrap gap-4">
              {statusDistribution.map((item) => (
                <div 
                  key={item.stato}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    item.stato === 'completato' ? 'bg-green-100 text-green-800' :
                    item.stato === 'in_corso' ? 'bg-yellow-100 text-yellow-800' :
                    item.stato === 'pianificato' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.stato}: {item.count}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
