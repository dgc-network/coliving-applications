import { useRef } from 'react'

import { useSpring, animated } from 'react-spring'

import {
  LandlordRecommendations,
  LandlordRecommendationsProps
} from './LandlordRecommendations'
import styles from './LandlordRecommendationsDropdown.module.css'

type LandlordRecommendationsDropdownProps = Omit<
  LandlordRecommendationsProps,
  'ref' | 'className' | 'itemClassName'
> & {
  isVisible: boolean
}

const fast = {
  tension: 300,
  friction: 40
}

export const LandlordRecommendationsDropdown = (
  props: LandlordRecommendationsDropdownProps
) => {
  const { isVisible } = props
  const childRef = useRef<HTMLElement | null>(null)

  const rect = childRef.current?.getBoundingClientRect()
  const childHeight = rect ? rect.bottom - rect.top : 0

  const spring = useSpring({
    opacity: isVisible ? 1 : 0,
    height: isVisible ? `${childHeight}px` : '0',
    from: { opacity: 0, height: `${childHeight}px` },
    config: fast
  })

  return (
    <animated.div className={styles.dropdown} style={spring}>
      <LandlordRecommendations
        ref={childRef}
        className={styles.landlordRecommendations}
        itemClassName={styles.landlordRecommendationsItem}
        {...props}
      />
    </animated.div>
  )
}
