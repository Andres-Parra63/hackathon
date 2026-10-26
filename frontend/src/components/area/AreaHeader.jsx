import '../panel/PanelHeader.css'

/** Title block for volunteer and admin areas (same look as the organization panel header). */
export default function AreaHeader({ title, subtitle, children }) {
  return (
    <header className="panel-header">
      <div className="panel-header__titles" data-stagger="up">
        <h1 className="t-h2-web c-strong">{title}</h1>
        <p className="t-body c-muted">{subtitle}</p>
      </div>
      {children && <div className="panel-header__actions">{children}</div>}
    </header>
  )
}
