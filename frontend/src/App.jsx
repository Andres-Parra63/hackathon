import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import RequireRole from './auth/RequireRole'
import { ROLES } from './auth/authContext'
import AdminLayout from './components/area/AdminLayout'
import VolunteerLayout from './components/area/VolunteerLayout'
import PanelLayout from './components/panel/PanelLayout'
import { useInteractions } from './motion/interactions'
import PageTransition from './motion/PageTransition'
import { scrollToTarget, useSmoothScroll } from './motion/smoothScroll'
import AdminEmergencies from './pages/admin/AdminEmergencies'
import AdminHome from './pages/admin/AdminHome'
import AdminOrgs from './pages/admin/AdminOrgs'
import AdminSkills from './pages/admin/AdminSkills'
import Landing from './pages/Landing'
import OrgLogin from './pages/OrgLogin'
import Activities from './pages/panel/Activities'
import Calls from './pages/panel/Calls'
import Dashboard from './pages/panel/Dashboard'
import Emergency from './pages/panel/Emergency'
import LiveMap from './pages/panel/LiveMap'
import PublicMap from './pages/PublicMap'
import StyleGuide from './pages/StyleGuide'
import VolunteerHome from './pages/volunteer/VolunteerHome'
import VolunteerHours from './pages/volunteer/VolunteerHours'
import VolunteerProfile from './pages/volunteer/VolunteerProfile'
import VolunteerShifts from './pages/volunteer/VolunteerShifts'
import VolunteerSignup from './pages/VolunteerSignup'

// Start every route at the top; /#section links scroll smoothly to their section.
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) scrollToTarget(hash, { offset: -80 })
    else scrollToTarget(0, { immediate: true })
  }, [pathname, hash])
  return null
}

export default function App() {
  useSmoothScroll()
  useInteractions()
  const { pathname } = useLocation()
  // Top-level section only: moving inside the panel keeps the sidebar still.
  const section = pathname.split('/')[1] || 'inicio'

  return (
    <>
      <ScrollToTop />
      <PageTransition key={section}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/mapa" element={<PublicMap />} />
          <Route path="/registro" element={<VolunteerSignup />} />
          <Route path="/ingreso" element={<OrgLogin />} />
          <Route element={<RequireRole role={ROLES.organization} />}>
            <Route path="/panel" element={<PanelLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="mapa" element={<LiveMap />} />
              <Route path="actividades" element={<Activities />} />
              <Route path="emergencia" element={<Emergency />} />
              <Route path="convocatorias" element={<Calls key="active" />} />
              <Route path="historial" element={<Calls key="history" initialTab="history" />} />
            </Route>
          </Route>
          <Route element={<RequireRole role={ROLES.volunteer} />}>
            <Route path="/voluntario" element={<VolunteerLayout />}>
              <Route index element={<VolunteerHome />} />
              <Route path="turnos" element={<VolunteerShifts />} />
              <Route path="horas" element={<VolunteerHours />} />
              <Route path="perfil" element={<VolunteerProfile />} />
            </Route>
          </Route>
          <Route element={<RequireRole role={ROLES.admin} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="organizaciones" element={<AdminOrgs />} />
              <Route path="emergencias" element={<AdminEmergencies />} />
              <Route path="habilidades" element={<AdminSkills />} />
            </Route>
          </Route>
          <Route path="/guia" element={<StyleGuide />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </>
  )
}
