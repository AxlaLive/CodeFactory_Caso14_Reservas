import { useState } from 'react'
import { authService } from './api/clinicService'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import ProfessionalPage from './pages/ProfessionalPage'

export default function App() {
  const [session, setSession] = useState(() => authService.session())
  const [weekDate, setWeekDate] = useState(() => new Date())

  const login = async (credentials) => setSession(await authService.login(credentials))
  const logout = () => {
    authService.logout()
    setSession(null)
  }

  if (!session) return <LoginPage onLogin={login} />

  if (session.role === 'professional') {
    return <ProfessionalPage session={session} weekDate={weekDate} onChangeWeek={setWeekDate} onLogout={logout} />
  }

  return <AdminPage session={session} weekDate={weekDate} onChangeWeek={setWeekDate} onLogout={logout} />
}
