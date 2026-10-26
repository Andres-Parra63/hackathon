import es from '../../i18n/es'
import AreaLayout from './AreaLayout'

const t = es.volunteer

const NAV = [
  { to: '/voluntario', end: true, icon: 'home', label: t.nav.home },
  { to: '/voluntario/turnos', icon: 'bell', label: t.nav.shifts, count: 1 },
  { to: '/voluntario/horas', icon: 'clock', label: t.nav.hours },
  { to: '/voluntario/perfil', icon: 'user', label: t.nav.profile },
]

export default function VolunteerLayout() {
  return <AreaLayout nav={NAV} identity={t.identity} help={t.help} />
}
