import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads data from the API: `{ data, error, loading, refreshing, reload, setData }`.
 * `loading` is only true before the first data arrives; later reloads keep the data on screen (`refreshing`).
 * `load` should be stable or listed in `deps`; a late response from an older call is ignored.
 */
export function useApi(load, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const call = useRef(0)

  const reload = useCallback(async () => {
    const id = ++call.current
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const data = await load()
      if (id === call.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (id === call.current) setState((current) => ({ ...current, error, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    reload()
  }, [reload])

  const setData = useCallback((update) => {
    setState((current) => ({ ...current, data: typeof update === 'function' ? update(current.data) : update }))
  }, [])

  return {
    data: state.data,
    error: state.data === null ? state.error : null,
    loading: state.loading && state.data === null,
    refreshing: state.loading && state.data !== null,
    reload,
    setData,
  }
}

/** Runs one mutation at a time: `{ run, busy, error, clearError }`. `run` returns the result or null. */
export function useAction() {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const run = useCallback(async (key, action) => {
    setBusy(key)
    setError(null)
    try {
      return await action()
    } catch (err) {
      setError(err)
      return null
    } finally {
      setBusy(null)
    }
  }, [])

  return { run, busy, error, clearError: () => setError(null) }
}
