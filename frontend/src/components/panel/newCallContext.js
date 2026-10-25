import { createContext, useContext } from 'react'

// Lets any "Nueva convocatoria" button in the panel open the side drawer (W04).
export const NewCallContext = createContext({ open: () => {} })

export const useNewCall = () => useContext(NewCallContext)
