import { useState } from 'react'
import { authService } from './api/clinicService'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import ProfessionalPage from './pages/ProfessionalPage'

export default function App() {
  const [session, setSession] = useState(() => authService.session())
  const [weekDate, setWeekDate] = useState(new Date(2026, 8, 16))

  const login = async (credentials) => setSession(await authService.login(credentials))
  const logout = () => {
    authService.logout()
    setSession(null)
  }

  if (!session) return <LoginPage onLogin={login} />

  // El profesional gestiona su agenda personal y solo visualiza la general.
  if (session.role === 'professional') {
    return <ProfessionalPage session={session} weekDate={weekDate} onChangeWeek={setWeekDate} onLogout={logout} />
  }

  return <AdminPage session={session} weekDate={weekDate} onChangeWeek={setWeekDate} onLogout={logout} />
}
