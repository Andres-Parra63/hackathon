import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import PageTransition from '../../motion/PageTransition'
import { NewCallContext } from './newCallContext'
import NewCallDrawer from './NewCallDrawer'
import Sidebar from './Sidebar'
import { createQuickCall } from '../../pages/panel/useOrgData'
import './PanelLayout.css'

/** Organization panel shell (W03–W06): 248 px sidebar + main column + W04 drawer. */
export default function PanelLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  // `?nueva=1` opens the drawer directly (deep link to W04).
  const [drawerOpen, setDrawerOpen] = useState(params.has('nueva'))
  const { data: skills } = useApi(() => api.skills(), [])

  const close = useCallback(() => setDrawerOpen(false), [])
  const context = useMemo(() => ({ open: () => setDrawerOpen(true) }), [])

  const handleSubmit = async (call) => {
    const emergencies = await api.emergencies(false)
    const emergency = emergencies.find((item) => item.solicitada_por === user.organizacion_id && item.estado === 'activa')
    const skillNames = (skills ?? []).filter((skill) => call.skills.includes(skill.id)).map((skill) => skill.nombre)
    await createQuickCall({ ...call, orgId: user.organizacion_id, userId: user.id, skillNames, emergency })
    setDrawerOpen(false)
    navigate('/panel/convocatorias')
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
      {drawerOpen &&
        createPortal(
          <NewCallDrawer
            onClose={close}
            onSubmit={handleSubmit}
            skillOptions={skills ?? []}
            organizationId={user.organizacion_id}
            userId={user.id}
          />,
          document.body,
        )}
    </NewCallContext.Provider>
  )
}
