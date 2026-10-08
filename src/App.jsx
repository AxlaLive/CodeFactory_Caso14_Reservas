import { useState } from 'react'
import { authService } from './api/clinicService'
import AdminPage from './pages/AdminPage'
import ClientPage from './pages/ClientPage'
import LoginPage from './pages/LoginPage'
import ProfessionalPage from './pages/ProfessionalPage'

export default function App() {
  const [session, setSession] = useState(() => authService.session())
  const [weekDate, setWeekDate] = useState(new Date(2026, 8, 16))

  const login = async (credentials) => setSession(await authService.login(credentials))
  const registerCustomer = async (details) => setSession(await authService.registerCustomer(details))
  const registerAdministrator = async (details) => setSession(await authService.registerAdministrator(details))
  const updateClient = (updatedSession) => setSession(updatedSession)
  const logout = () => {
    authService.logout()
    setSession(null)
  }

  if (!session) return <LoginPage onLogin={login} onRegisterCustomer={registerCustomer} onRegisterAdministrator={registerAdministrator} />

  if (session.role === 'client') {
    return <ClientPage session={session} onUpdateSession={updateClient} onLogout={logout} />
  }

  // El profesional gestiona su agenda personal y solo visualiza la general.
  if (session.role === 'professional') {
    return <ProfessionalPage session={session} weekDate={weekDate} onChangeWeek={setWeekDate} onLogout={logout} />
  }

  return <AdminPage session={session} weekDate={weekDate} onChangeWeek={setWeekDate} onLogout={logout} />
}
