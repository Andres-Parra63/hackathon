import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import es from '../../i18n/es'
import PageTransition from '../../motion/PageTransition'
import { NewCallContext } from './newCallContext'
import NewCallDrawer from './NewCallDrawer'
import PanelRail from './PanelRail'
import PanelTopbar from './PanelTopbar'
import { usePanelTheme } from './usePanelTheme'
import './PanelLayout.css'

/**
 * Organization panel shell (W03–W06): a rounded app frame on a soft canvas, with a sticky top bar,
 * a floating icon rail and the W04 drawer. Light theme by default, dark on request.
 */
export default function PanelLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const { theme, setTheme } = usePanelTheme()
  // `?nueva=1` opens the drawer directly (deep link to W04).
  const [drawerOpen, setDrawerOpen] = useState(params.has('nueva'))

  const close = useCallback(() => setDrawerOpen(false), [])
  const context = useMemo(() => ({ open: () => setDrawerOpen(true) }), [])

  const handleSubmit = (call) => {
    setDrawerOpen(false)
    navigate('/panel/mapa', { state: { sent: call } })
  }

  return (
    <NewCallContext.Provider value={context}>
      <div className="shell">
        <a href="#panel-main" className="shell__skip">
          {es.panel.skip}
        </a>
        <div className="shell__frame">
          <PanelTopbar theme={theme} onTheme={setTheme} />
          <PanelRail theme={theme} onTheme={setTheme} />
          <main id="panel-main" className="shell__main" tabIndex={-1}>
            <PageTransition key={pathname}>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
      {drawerOpen && createPortal(<NewCallDrawer onClose={close} onSubmit={handleSubmit} />, document.body)}
    </NewCallContext.Provider>
  )
}
