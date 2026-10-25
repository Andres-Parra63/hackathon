import { Outlet, useLocation } from 'react-router-dom'
import PageTransition from '../../motion/PageTransition'
import Sidebar from '../panel/Sidebar'
import '../panel/PanelLayout.css'

/** Shell for the volunteer and admin areas: sidebar + routed content. */
export default function AreaLayout({ nav, identity, help }) {
  const { pathname } = useLocation()
  return (
    <div className="panel">
      <Sidebar nav={nav} identity={identity} help={help} />
      <main className="panel__main">
        <PageTransition key={pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}
