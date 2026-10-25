import isotipo from '../assets/brand/isotipo.svg'
import marca from '../assets/brand/marca.svg'
import es from '../i18n/es'
import './Logo.css'

/** Horizontal logo (Logo/Manos en Red): 32 px isotype + 22/26 ExtraBold wordmark. */
export default function Logo({ boxed = false, className = '' }) {
  return (
    <span className={`logo ${boxed ? 'logo--boxed' : ''} ${className}`}>
      <img src={isotipo} width="32" height="32" alt="" />
      <span className="logo__word">{es.brand.name}</span>
    </span>
  )
}

/** App icon (Logo/Ícono app): 40 px brand tile with the white mark. */
export function AppIcon() {
  return (
    <span className="app-icon" aria-hidden="true">
      <img src={marca} width="24" height="24" alt="" />
    </span>
  )
}
