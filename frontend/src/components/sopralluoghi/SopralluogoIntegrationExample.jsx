// ESEMPIO DI INTEGRAZIONE IN InterventionDetail.jsx
// Copiare questo codice nella pagina InterventionDetail dove si vuole 
// mostrare il form di sopralluogo

import { useState } from 'react'
import { SopralluogoForm } from './sopralluoghi'
import { ClipboardList } from 'lucide-react'

// Aggiungere questo componente dentro InterventionDetail
export function SopralluogoSection({ interventionId, existingData }) {
  const [showForm, setShowForm] = useState(false)
  const [tipoSopralluogo, setTipoSopralluogo] = useState('')

  const tipi = [
    { value: 'zanzare', label: 'Zanzare', color: 'blue' },
    { value: 'ratti', label: 'Ratti', color: 'green' },
    { value: 'blatte', label: 'Blatte', color: 'yellow' }
  ]

  if (!showForm) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg">Sopralluogo</h3>
        </div>
        
        {existingData ? (
          <div className="mb-4">
            <p className="text-green-600 font-medium">
              ✓ Sopralluogo già completato ({existingData.tipoSopralluogo})
            </p>
            <button 
              onClick={() => {
                setTipoSopralluogo(existingData.tipoSopralluogo)
                setShowForm(true)
              }}
              className="mt-2 text-blue-600 hover:underline"
            >
              Modifica sopralluogo
            </button>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">Nessun sopralluogho registrato per questo intervento.</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {tipi.map(tipo => (
            <button
              key={tipo.value}
              onClick={() => {
                setTipoSopralluogo(tipo.value)
                setShowForm(true)
              }}
              className={`p-4 rounded-lg border-2 border-${tipo.color}-200 hover:border-${tipo.color}-400 bg-${tipo.color}-50 transition-colors`}
            >
              <span className="font-medium text-gray-800">{tipo.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Nuovo Sopralluogo - {tipoSopralluogo.toUpperCase()}</h3>
        <button 
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕ Chiudi
        </button>
      </div>
      
      <SopralluogoForm 
        interventionId={interventionId}
        tipoSopralluogo={tipoSopralluogo}
        onComplete={() => {
          setShowForm(false)
          // Ricarica i dati dell'intervento
          window.location.reload()
        }}
      />
    </div>
  )
}

// ISTRUZIONI PER L'INTEGRAZIONE:
// 1. Importare SopralluogoSection in InterventionDetail.jsx
// 2. Aggiungere <SopralluogoSection interventionId={id} existingData={intervention.sopralluogoData} /> 
//    nel punto dove si vuole mostrare il form
// 3. Assicurarsi che il backend abbia il campo sopralluogoData nel modello Intervention
