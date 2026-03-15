import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { authAPI, settingsAPI } from '../services/api'
import { Building2, Shield, Bell, User, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useAuthStore()
  const [openCard, setOpenCard] = useState(null)
  const [settings, setSettings] = useState({})
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form Azienda (salvato in backend settings)
  const [azienda, setAzienda] = useState({
    ragioneSociale: '',
    indirizzo: '',
    piva: '',
    telefono: '',
    email: ''
  })

  // Form Sicurezza - Cambio password
  const [passwordForm, setPasswordForm] = useState({
    passwordAttuale: '',
    nuovaPassword: '',
    confermaPassword: ''
  })

  const isAdmin = user?.ruolo === 'admin'

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.getAll()
      const data = res.data.data || {}
      setSettings(data)
      setAzienda({
        ragioneSociale: data.azienda_ragioneSociale || '',
        indirizzo: data.azienda_indirizzo || '',
        piva: data.azienda_piva || '',
        telefono: data.azienda_telefono || '',
        email: data.azienda_email || ''
      })
    } catch (err) {
      toast.error('Errore caricamento impostazioni')
    } finally {
      setLoadingSettings(false)
    }
  }

  const saveAzienda = async (e) => {
    e.preventDefault()
    if (!isAdmin) {
      toast.error('Solo l’admin può modificare i dati azienda')
      return
    }
    setSaving(true)
    try {
      await settingsAPI.update({
        azienda_ragioneSociale: azienda.ragioneSociale,
        azienda_indirizzo: azienda.indirizzo,
        azienda_piva: azienda.piva,
        azienda_telefono: azienda.telefono,
        azienda_email: azienda.email
      })
      toast.success('Dati azienda salvati')
      loadSettings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.nuovaPassword !== passwordForm.confermaPassword) {
      toast.error('La conferma password non coincide')
      return
    }
    if (passwordForm.nuovaPassword.length < 6) {
      toast.error('La nuova password deve essere di almeno 6 caratteri')
      return
    }
    setSaving(true)
    try {
      await authAPI.changePassword(passwordForm.passwordAttuale, passwordForm.nuovaPassword)
      toast.success('Password aggiornata')
      setPasswordForm({ passwordAttuale: '', nuovaPassword: '', confermaPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore aggiornamento password')
    } finally {
      setSaving(false)
    }
  }

  const toggleCard = (key) => {
    setOpenCard(openCard === key ? null : key)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>

      {/* Profilo utente */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.nome} {user?.cognome}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">Ruolo: {user?.ruolo}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Azienda */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleCard('azienda')}
            className="w-full text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Azienda</h3>
                <p className="text-sm text-gray-600">Dati aziendali e contatti</p>
              </div>
            </div>
            {openCard === 'azienda' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {openCard === 'azienda' && (
            <form onSubmit={saveAzienda} className="mt-4 pt-4 border-t space-y-3">
              <input
                type="text"
                className="input"
                placeholder="Ragione sociale"
                value={azienda.ragioneSociale}
                onChange={(e) => setAzienda({ ...azienda, ragioneSociale: e.target.value })}
              />
              <input
                type="text"
                className="input"
                placeholder="Indirizzo"
                value={azienda.indirizzo}
                onChange={(e) => setAzienda({ ...azienda, indirizzo: e.target.value })}
              />
              <input
                type="text"
                className="input"
                placeholder="P.IVA"
                value={azienda.piva}
                onChange={(e) => setAzienda({ ...azienda, piva: e.target.value })}
              />
              <input
                type="text"
                className="input"
                placeholder="Telefono"
                value={azienda.telefono}
                onChange={(e) => setAzienda({ ...azienda, telefono: e.target.value })}
              />
              <input
                type="email"
                className="input"
                placeholder="Email"
                value={azienda.email}
                onChange={(e) => setAzienda({ ...azienda, email: e.target.value })}
              />
              {isAdmin && (
                <button type="submit" disabled={saving} className="btn-primary w-full">
                  {saving ? 'Salvataggio...' : 'Salva dati azienda'}
                </button>
              )}
            </form>
          )}
        </div>

        {/* Notifiche */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleCard('notifiche')}
            className="w-full text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Notifiche</h3>
                <p className="text-sm text-gray-600">Promemoria e avvisi</p>
              </div>
            </div>
            {openCard === 'notifiche' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {openCard === 'notifiche' && (
            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              <p>Le notifiche email per i promemoria interventi sono gestite dalla configurazione del backend (SMTP).</p>
              <p className="mt-2">Configura le variabili SMTP nel file .env del server per abilitare l’invio email.</p>
            </div>
          )}
        </div>

        {/* Sicurezza */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleCard('sicurezza')}
            className="w-full text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Sicurezza</h3>
                <p className="text-sm text-gray-600">Cambia password</p>
              </div>
            </div>
            {openCard === 'sicurezza' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {openCard === 'sicurezza' && (
            <form onSubmit={handleChangePassword} className="mt-4 pt-4 border-t space-y-3">
              <input
                type="password"
                className="input"
                placeholder="Password attuale"
                value={passwordForm.passwordAttuale}
                onChange={(e) => setPasswordForm({ ...passwordForm, passwordAttuale: e.target.value })}
                required
              />
              <input
                type="password"
                className="input"
                placeholder="Nuova password"
                value={passwordForm.nuovaPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, nuovaPassword: e.target.value })}
                required
                minLength={6}
              />
              <input
                type="password"
                className="input"
                placeholder="Conferma nuova password"
                value={passwordForm.confermaPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confermaPassword: e.target.value })}
                required
              />
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Salvataggio...' : 'Cambia password'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni sistema</h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Versione:</span> Hygienix v1.0.0</p>
          <p><span className="text-gray-500">Database:</span> SQLite</p>
          <p><span className="text-gray-500">Ambiente:</span> {import.meta.env.MODE}</p>
        </div>
      </div>
    </div>
  )
}
