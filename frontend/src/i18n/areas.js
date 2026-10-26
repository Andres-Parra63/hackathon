// UI copy for sign-in and shared states (es-CO). Merged into es.js.
export const auth = {
  roles: { voluntario: 'Voluntario', organizacion: 'Organización', administrador: 'Administrador' },
  // Fictional accounts loaded by backend/datos_ejemplo.sql (never real data, Ley 1581 de 2012).
  demoAccounts: {
    voluntario: 'camila@correo.demo',
    organizacion: 'coordinacion@redsolidaria.demo',
    administrador: 'admin@manosenred.demo',
  },
  demoPassword: 'demo-no-usar',
  demoTitle: 'Cuentas de demostración',
  demoText: 'Datos ficticios cargados con datos_ejemplo.sql. Entra con el rol que quieras probar.',
  demoAs: {
    voluntario: 'Entrar como voluntario',
    organizacion: 'Entrar como organización',
    administrador: 'Entrar como administrador',
  },
  signingIn: 'Ingresando…',
}

export const loadState = {
  loading: 'Cargando…',
  session: 'Comprobando tu sesión…',
  errorTitle: 'No pudimos cargar esta información',
  retry: 'Reintentar',
}

// Shared shell of the organization, volunteer and admin areas.
export const shell = {
  menu: 'Menú principal',
  shortcuts: 'Accesos rápidos',
  logout: 'Cerrar sesión',
  close: 'Cerrar',
}
