import es from '../../i18n/es'
import AreaLayout from './AreaLayout'

const t = es.admin

const NAV = [
  { to: '/admin', end: true, icon: 'dashboard', label: t.nav.home },
  { to: '/admin/organizaciones', icon: 'building', label: t.nav.orgs, count: 2 },
  { to: '/admin/emergencias', icon: 'alert-triangle', label: t.nav.emergencies, count: 1 },
  { to: '/admin/habilidades', icon: 'list', label: t.nav.skills },
]

export default function AdminLayout() {
  return <AreaLayout nav={NAV} identity={t.identity} help={t.help} />
}
