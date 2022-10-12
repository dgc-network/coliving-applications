import { useRef, useCallback, useEffect } from 'react'
import * as React from 'react'

import { TimeData } from './types'

/** Sets animation properties on the handle and digital_content. */
const animate = (
  digitalContentRef: React.MutableRefObject<HTMLDivElement | null>,
  handleRef: React.MutableRefObject<HTMLDivElement | null>,
  transition: string,
  transform: string
) => {
  if (handleRef.current && digitalContentRef.current) {
    handleRef.current.style.transition = transition
    handleRef.current.style.transform = transform

    digitalContentRef.current.style.transition = transition
    digitalContentRef.current.style.transform = transform
  }
}

/**
 * Hook for initializing animations for a scrubber.
 * const animations = useAnimations()
 */
export const useAnimations = (
  digitalContentRef: React.MutableRefObject<HTMLDivElement | null>,
  handleRef: React.MutableRefObject<HTMLDivElement | null>,
  elapsedSeconds: number,
  totalSeconds: number
) => {
  /** Animates from the current position to the end over the remaining seconds. */
  const play = useCallback(() => {
    const timeRemaining = totalSeconds - elapsedSeconds
    animate(
      digitalContentRef,
      handleRef,
      `transform ${timeRemaining}s linear`,
      'translate(100%)'
    )
  }, [digitalContentRef, handleRef, elapsedSeconds, totalSeconds])

  /**
   * Pauses the animation at the current position.
   * NOTE: We derive the current position from the actual animation position
   * rather than the remaining time so that pausing the scrubber does not
   * cause jumping if elapsed seconds doesn't precisely reflect the animation.
   */
  const pause = useCallback(() => {
    if (digitalContentRef.current) {
      const digitalContentWidth = digitalContentRef.current.offsetWidth
      const digitalContentTransform = window
        .getComputedStyle(digitalContentRef.current)
        .getPropertyValue('transform')

      const digitalContentPosition = parseFloat(digitalContentTransform.split(',')[4])
      const percentComplete = digitalContentPosition / digitalContentWidth
      animate(
        digitalContentRef,
        handleRef,
        'none',
        `translate(${percentComplete * 100}%)`
      )
    }
  }, [digitalContentRef, handleRef])

  /** Sets the animation to a given percentage: [0, 1]. */
  const setPercent = useCallback(
    (percentComplete: number) => {
      animate(
        digitalContentRef,
        handleRef,
        'none',
        `translate(${percentComplete * 100}%)`
      )
    },
    [digitalContentRef, handleRef]
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
