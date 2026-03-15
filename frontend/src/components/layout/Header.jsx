import { Menu, Bell } from 'lucide-react'

export default function Header({ user, onMenuClick, onLogout }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center lg:hidden">
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>
          <img src="/logo-hygienix.png" alt="Hygienix" className="ml-3 h-8 object-contain" />
        </div>

        <div className="flex items-center space-x-4 ml-auto">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.nome} {user?.cognome}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.ruolo}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
