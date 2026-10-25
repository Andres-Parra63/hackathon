import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import CursorGlow from './components/CursorGlow'
import PanelLayout from './components/panel/PanelLayout'
import { useInteractions } from './motion/interactions'
import PageTransition from './motion/PageTransition'
import { scrollToTarget, useSmoothScroll } from './motion/smoothScroll'
import Landing from './pages/Landing'
import OrgLogin from './pages/OrgLogin'
import Calls from './pages/panel/Calls'
import Dashboard from './pages/panel/Dashboard'
import LiveMap from './pages/panel/LiveMap'
import StyleGuide from './pages/StyleGuide'
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
      <CursorGlow />
      <ScrollToTop />
      <PageTransition key={section}>
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
      </PageTransition>
    </>
  )
}
