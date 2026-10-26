import AppShell from './AppShell'
import '../panel/PanelLayout.css'

/** Shell for the volunteer and admin areas: top bar, icon rail and routed content. */
export default function AreaLayout({ nav, identity, help }) {
  return <AppShell nav={nav} identity={identity} help={help} />
}
