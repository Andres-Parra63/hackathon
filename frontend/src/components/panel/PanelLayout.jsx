import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import PageTransition from '../../motion/PageTransition'
import { NewCallContext } from './newCallContext'
import NewCallDrawer from './NewCallDrawer'
import Sidebar from './Sidebar'
import './PanelLayout.css'

/** Organization panel shell (W03–W06): 248 px sidebar + main column + W04 drawer. */
export default function PanelLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
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
      <div className="panel">
        <Sidebar />
        <main className="panel__main">
          <PageTransition key={pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      {drawerOpen && createPortal(<NewCallDrawer onClose={close} onSubmit={handleSubmit} />, document.body)}
    </NewCallContext.Provider>
  )
}
