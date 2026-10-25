import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'

/** Profile, nearby calls, own participations and hours of the signed-in volunteer. */
export function useVolunteerData() {
  const { user } = useAuth()
  const id = user.id
  return useApi(async () => {
    const [profile, nearby, participations, hours] = await Promise.all([
      api.volunteer(id),
      api.nearbyCalls(id),
      api.myParticipations(id),
      api.hours(id),
    ])
    return { profile, nearby, participations, hours }
  }, [id])
}

// A participation still "open" for the volunteer (not declined, cancelled or rejected).
export const isOpen = (p) => ['pendiente', 'confirmado', 'en_camino'].includes(p.estado)
