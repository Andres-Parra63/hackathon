import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import PanelLayout from './components/panel/PanelLayout'
import Landing from './pages/Landing'
import OrgLogin from './pages/OrgLogin'
import Calls from './pages/panel/Calls'
import Dashboard from './pages/panel/Dashboard'
import LiveMap from './pages/panel/LiveMap'
import StyleGuide from './pages/StyleGuide'
import VolunteerSignup from './pages/VolunteerSignup'

// Start every route at the top, except in-page anchors (/#como-funciona).
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registro" element={<VolunteerSignup />} />
        <Route path="/ingreso" element={<OrgLogin />} />
        <Route path="/panel" element={<PanelLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="mapa" element={<LiveMap />} />
          <Route path="convocatorias" element={<Calls key="active" />} />
          <Route path="historial" element={<Calls key="history" initialTab="history" />} />
        </Route>
        <Route path="/guia" element={<StyleGuide />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
