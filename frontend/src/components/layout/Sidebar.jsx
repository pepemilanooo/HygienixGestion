import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  ClipboardList, 
  Calendar, 
  Package, 
  UserCircle,
  Settings,
  LogOut,
  X,
  FileText,
  Receipt,
  Search
} from 'lucide-react'

const menuItemsAll = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/clients', label: 'Clienti', icon: Users },
  { path: '/interventions', label: 'Interventi', icon: ClipboardList },
  { path: '/sopralluoghi', label: 'Sopralluoghi', icon: Search },
  { path: '/calendar', label: 'Calendario', icon: Calendar },
  { path: '/preventivi', label: 'Preventivi', icon: FileText },
  { path: '/fatture', label: 'Fatture', icon: Receipt },
  { path: '/products', label: 'Prodotti', icon: Package },
  { path: '/technicians', label: 'Tecnici', icon: UserCircle },
  { path: '/settings', label: 'Impostazioni', icon: Settings },
]

// Solo Calendario, Interventi e Sopralluoghi per i tecnici
const menuItemsTecnico = [
  { path: '/interventions', label: 'Interventi', icon: ClipboardList },
  { path: '/sopralluoghi', label: 'Sopralluoghi', icon: Search },
  { path: '/calendar', label: 'Calendario', icon: Calendar },
]

export default function Sidebar({ user, onLogout, mobile, onClose }) {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <img src="/logo-hygienix.png" alt="Hygienix Ecologia Ambiente" className="h-10 object-contain" />
        {mobile && (
          <button onClick={onClose} className="p-1">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {(user?.ruolo === 'tecnico' ? menuItemsTecnico : menuItemsAll).map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={mobile ? onClose : undefined}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active 
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {user?.nome?.[0]}{user?.cognome?.[0]}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.nome} {user?.cognome}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.ruolo}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  )
}
