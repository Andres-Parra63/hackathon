import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import es from '../../i18n/es'
import AppShell, { ShellAction } from '../area/AppShell'
import Icon from '../Icon'
import { NewCallContext } from './newCallContext'
import NewCallDrawer from './NewCallDrawer'
import { createQuickCall } from '../../pages/panel/useOrgData'
import './PanelLayout.css'

const t = es.panel

const NAV = [
  { to: '/panel', end: true, icon: 'dashboard', label: t.nav.dashboard },
  { to: '/panel/mapa', icon: 'map', label: t.nav.map },
  { to: '/panel/actividades', icon: 'calendar', label: es.orgArea.nav.activities },
  { to: '/panel/emergencia', icon: 'alert-triangle', label: es.orgArea.nav.emergency },
  { to: '/panel/convocatorias', icon: 'bell', label: t.nav.calls, count: 1 },
  { to: '/panel/historial', icon: 'list', label: t.nav.history },
]
const IDENTITY = { icon: 'building', ...t.org }

/** Organization panel (W03–W06): app shell + W04 "Nueva convocatoria" drawer. */
export default function PanelLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
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
      <AppShell
        nav={NAV}
        identity={IDENTITY}
        help={t.help}
        actions={<ShellAction to="/panel/convocatorias" icon="bell" label={t.notifications} dot />}
        railActions={
          <button type="button" className="shell__rail-link shell__rail-link--cta" aria-label={t.newCall} onClick={context.open}>
            <Icon name="plus" size={18} />
            <span className="shell__tip" aria-hidden="true">
              {t.newCall}
            </span>
          </button>
        }
      />
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
