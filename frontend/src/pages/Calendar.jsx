import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import { interventionsAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { it } from 'date-fns/locale'
import 'react-calendar/dist/Calendar.css'

export default function CalendarPage() {
  const { user } = useAuthStore()
  const [interventions, setInterventions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInterventions()
  }, [])

  const loadInterventions = async () => {
    try {
      const start = startOfMonth(new Date())
      const end = endOfMonth(new Date())
      
      const params = {
        from: start.toISOString(),
        to: end.toISOString()
      }
      if (user?.ruolo === 'tecnico') params.tecnicoId = user.id

      const response = await interventionsAPI.getAll(params)
      setInterventions(response.data.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInterventionsForDate = (date) => {
    return interventions.filter(i => {
      if (!i.dataProgrammata) return false
      const interventionDate = new Date(i.dataProgrammata)
      return (
        interventionDate.getDate() === date.getDate() &&
        interventionDate.getMonth() === date.getMonth() &&
        interventionDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayInterventions = getInterventionsForDate(date)
      if (dayInterventions.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <span className="h-2 w-2 bg-primary-500 rounded-full"></span>
          </div>
        )
      }
    }
    return null
  }

  const selectedInterventions = getInterventionsForDate(selectedDate)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Calendario Interventi</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            className="w-full border-0"
            locale="it-IT"
          />
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">
            Interventi del {format(selectedDate, 'dd MMMM yyyy', { locale: it })}
          </h2>
          
          {selectedInterventions.length === 0 ? (
            <p className="text-gray-500">Nessun intervento programmato</p>
          ) : (
            <div className="space-y-3">
              {selectedInterventions.map((i) => (
                <div key={i.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{i.client?.ragioneSociale}</p>
                      <p className="text-sm text-gray-500">{i.location?.nomeSede}</p>
                      <p className="text-sm text-primary-600">
                        {i.dataProgrammata && format(new Date(i.dataProgrammata), 'HH:mm')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      i.stato === 'completato' ? 'bg-green-100 text-green-800' :
                      i.stato === 'in_corso' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {i.stato}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
