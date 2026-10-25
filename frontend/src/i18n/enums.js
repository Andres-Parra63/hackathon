// Spanish labels for the API enum values (backend/models.py).
export const enums = {
  pointType: {
    centro_acopio: 'Centro de acopio',
    albergue: 'Albergue',
    banco_sangre: 'Banco de sangre',
    comedor: 'Comedor',
    puesto_salud: 'Puesto de salud',
    otro: 'Otro',
  },
  emergencyType: {
    inundacion: 'Inundación',
    sismo: 'Sismo',
    tormenta: 'Tormenta',
    deslizamiento: 'Deslizamiento',
    incendio: 'Incendio',
    otra: 'Otra',
  },
  emergencyState: {
    por_confirmar: 'Por confirmar',
    activa: 'Activa',
    cerrada: 'Cerrada',
    rechazada: 'Rechazada',
  },
  verification: { pendiente: 'Por verificar', verificada: 'Verificada', rechazada: 'Rechazada' },
  orgType: {
    fundacion: 'Fundación',
    odv: 'Organización de voluntariado',
    junta_accion_comunal: 'Junta de acción comunal',
    entidad_publica: 'Entidad pública',
    organismo_socorro: 'Organismo de socorro',
    empresa: 'Empresa',
    universidad: 'Universidad',
    otra: 'Otra',
  },
  skillCategory: {
    salud: 'Salud',
    logistica: 'Logística',
    construccion: 'Construcción',
    psicosocial: 'Psicosocial',
    alimentacion: 'Alimentación',
    transporte: 'Transporte',
    comunicacion: 'Comunicación',
    cuidado: 'Cuidado',
    general: 'General',
  },
  callType: { normal: 'Actividad', prioritaria: 'Prioritaria', desastre: 'Emergencia' },
  callState: {
    borrador: 'Borrador',
    publicada: 'Publicada',
    cubierta: 'Cubierta',
    cerrada: 'Cerrada',
    cancelada: 'Cancelada',
  },
  participation: {
    pendiente: 'Sin respuesta',
    confirmado: 'Confirmó',
    en_camino: 'En camino',
    no_puede: 'No puede',
    rechazado: 'Rechazado',
    cancelado: 'Cancelado',
  },
  slot: { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' },
}

// Badge tone per state (always shown with its text label).
export const TONES = {
  emergencyState: { por_confirmar: 'warning', activa: 'warning', cerrada: 'neutral', rechazada: 'neutral' },
  verification: { pendiente: 'warning', verificada: 'success', rechazada: 'neutral' },
  callState: { borrador: 'neutral', publicada: 'info', cubierta: 'success', cerrada: 'neutral', cancelada: 'neutral' },
  participation: {
    pendiente: 'warning',
    confirmado: 'success',
    en_camino: 'success',
    no_puede: 'neutral',
    rechazado: 'neutral',
    cancelado: 'neutral',
  },
}
