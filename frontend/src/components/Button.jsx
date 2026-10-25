import { Link } from 'react-router-dom'
import Icon from './Icon'
import './Button.css'

/**
 * Botón (Figma 4:23). Variants: primary, secondary, tertiary. 52 px tall, 14 px radius.
 * Renders a router <Link> when `to` is set, an <a> when `href` is set, a <button> otherwise.
 */
export default function Button({
  variant = 'primary',
  icon,
  iconClass = '',
  block = false,
  to,
  href,
  className = '',
  children,
  ...rest
}) {
  const classes = `btn btn--${variant} ${block ? 'btn--block' : ''} ${className}`
  const content = (
    <>
      {icon && <Icon name={icon} size={20} className={iconClass} />}
      <span>{children}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  )
}
