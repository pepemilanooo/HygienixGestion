import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { dashboardAPI } from '../services/api'
import { Users, ClipboardList, CheckCircle, AlertTriangle, Calendar, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats()
      setStats(response.data.data)
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Errore caricamento dati'
      toast.error(msg)
      setStats({
        clients: { total: 0, newThisMonth: 0 },
        interventions: { total: 0, today: 0, pending: 0, completed: 0 },
        inventory: { lowStock: 0 },
        recent: [],
        interventiPerMese: []
      })
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
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Clienti" 
          value={stats?.clients?.total || 0}
          subtitle={`+${stats?.clients?.newThisMonth || 0} questo mese`}
          icon={<Users className="h-6 w-6 text-blue-500" />}
        />
        <StatCard 
          title="Interventi Totali" 
          value={stats?.interventions?.total || 0}
          subtitle={`${stats?.interventions?.completed || 0} completati`}
          icon={<ClipboardList className="h-6 w-6 text-purple-500" />}
        />
        <StatCard 
          title="Oggi" 
          value={stats?.interventions?.today || 0}
          subtitle="interventi programmati"
          icon={<Calendar className="h-6 w-6 text-green-500" />}
        />
        <StatCard 
          title="Scorte Basse" 
          value={stats?.inventory?.lowStock || 0}
          subtitle="prodotti da riordinare"
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
          link="/products"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction to="/interventions/new" icon={ClipboardList} label="Nuovo Intervento" color="blue" />
          <QuickAction to="/clients/new" icon={Users} label="Nuovo Cliente" color="green" />
          <QuickAction to="/calendar" icon={Calendar} label="Calendario" color="purple" />
          <QuickAction to="/products" icon={TrendingUp} label="Inventario" color="orange" />
        </div>
      </div>

      {/* Statistiche interventi per mese */}
      {stats?.interventiPerMese?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Interventi per mese (ultimi 6 mesi)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.interventiPerMese.map(({ mese, totale }) => ({ name: mese, interventi: totale }))}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="interventi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Interventions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Interventi Recenti</h2>
        <div className="divide-y">
          {stats?.recent?.length === 0 ? (
            <p className="text-gray-500 py-4">Nessun intervento recente</p>
          ) : (
            stats?.recent?.map((intervention) => (
              <div key={intervention.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{intervention.client?.ragioneSociale}</p>
                  <p className="text-sm text-gray-500">{intervention.tipoIntervento?.nome} - {intervention.location?.nomeSede}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  intervention.stato === 'completato' ? 'bg-green-100 text-green-800' :
                  intervention.stato === 'in_corso' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {intervention.stato}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, link }) {
  const Wrapper = link ? Link : 'div'
  return (
    <Wrapper to={link} className={`card ${link ? 'hover:shadow-md cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      </div>
    </Wrapper>
  )
}

function QuickAction({ to, icon: Icon, label, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
  }
  
  return (
    <Link to={to} className={`p-4 rounded-lg text-center transition-colors ${colors[color]}`}>
      <Icon className="h-8 w-8 mx-auto mb-2" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
