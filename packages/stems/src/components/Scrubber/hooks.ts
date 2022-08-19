import { useRef, useCallback, useEffect } from 'react'
import * as React from 'react'

import { TimeData } from './types'

/** Sets animation properties on the handle and agreement. */
const animate = (
  agreementRef: React.MutableRefObject<HTMLDivElement | null>,
  handleRef: React.MutableRefObject<HTMLDivElement | null>,
  transition: string,
  transform: string
) => {
  if (handleRef.current && agreementRef.current) {
    handleRef.current.style.transition = transition
    handleRef.current.style.transform = transform

    agreementRef.current.style.transition = transition
    agreementRef.current.style.transform = transform
  }
}

/**
 * Hook for initializing animations for a scrubber.
 * const animations = useAnimations()
 */
export const useAnimations = (
  agreementRef: React.MutableRefObject<HTMLDivElement | null>,
  handleRef: React.MutableRefObject<HTMLDivElement | null>,
  elapsedSeconds: number,
  totalSeconds: number
) => {
  /** Animates from the current position to the end over the remaining seconds. */
  const play = useCallback(() => {
    const timeRemaining = totalSeconds - elapsedSeconds
    animate(
      agreementRef,
      handleRef,
      `transform ${timeRemaining}s linear`,
      'translate(100%)'
    )
  }, [agreementRef, handleRef, elapsedSeconds, totalSeconds])

  /**
   * Pauses the animation at the current position.
   * NOTE: We derive the current position from the actual animation position
   * rather than the remaining time so that pausing the scrubber does not
   * cause jumping if elapsed seconds doesn't precisely reflect the animation.
   */
  const pause = useCallback(() => {
    if (agreementRef.current) {
      const agreementWidth = agreementRef.current.offsetWidth
      const agreementTransform = window
        .getComputedStyle(agreementRef.current)
        .getPropertyValue('transform')

      const agreementPosition = parseFloat(agreementTransform.split(',')[4])
      const percentComplete = agreementPosition / agreementWidth
      animate(
        agreementRef,
        handleRef,
        'none',
        `translate(${percentComplete * 100}%)`
      )
    }
  }, [agreementRef, handleRef])

  /** Sets the animation to a given percentage: [0, 1]. */
  const setPercent = useCallback(
    (percentComplete: number) => {
      animate(
        agreementRef,
        handleRef,
        'none',
        `translate(${percentComplete * 100}%)`
      )
    },
    [agreementRef, handleRef]
  )

  /**
   * Handle window focus events so that the scrubber can repair itself
   * if/when the browser loses focus and kills animations.
   */
  const timeData = useRef<TimeData>()
  timeData.current = { elapsedSeconds, totalSeconds }
  useEffect(() => {
    const onWindowFocus = () => {
      if (timeData.current) {
        setPercent(
          timeData.current.elapsedSeconds / timeData.current.totalSeconds
        )
      }
    }
    window.addEventListener('focus', onWindowFocus)
    return () => window.removeEventListener('focus', onWindowFocus)
  }, [timeData, setPercent])

  return { play, pause, setPercent }
}
