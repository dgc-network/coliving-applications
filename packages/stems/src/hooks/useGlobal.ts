import { useEffect, useMemo } from 'react'

declare global {
  interface Window {
    ColivingStems: any
  }
}

window.ColivingStems = window.ColivingStems || {}

/**
 * Hook to "share state" between components using the global window object.
 * Obviously, comes with caveats with globals.
 *
 * @param name shared name between users of a useGlobal
 * @param initialValue
 * @returns getter, setter
 *  Similar to useState, except
 *  1. The getter is a function to allow for fresh fetches (pulls off of window at each invocation)
 *  2. The setter can/should only be invoked with a mutator function rather than a "new value"
 */
export const useGlobal = <T>(
  name: string,
  initialValue: T
): [() => T, (mutator: (cur: T) => void) => void] => {
  useEffect(() => {
    if (window.ColivingStems[name] === undefined) {
      window.ColivingStems[name] = initialValue
    }
  }, [name, initialValue])

  const getter = useMemo(() => () => window.ColivingStems[name], [name])
  const setter = useMemo(
    () => (mutator: (cur: T) => void) => {
      window.ColivingStems[name] = mutator(window.ColivingStems[name])
    },
    [name]
  )

  return [getter, setter]
}
