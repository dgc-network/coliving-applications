import { ReactNode } from 'react'

import cn from 'classnames'

import { ReactComponent as IconDigitalcoinRewardsPill } from 'assets/img/iconDigitalcoinRewardsPill.svg'

import styles from './colorTile.module.css'

type ColorTileProps = {
  title: string
  link: string
  description?: string
  gradient?: string
  shadow?: string
  icon?: ReactNode | JSX.Element | null
  emoji?: string
  className?: string
  goToRoute: (route: string) => void
  isIncentivized?: boolean
}

const ColorTile = ({
  title,
  link,
  description,
  gradient,
  shadow,
  icon,
  emoji,
  className,
  goToRoute,
  isIncentivized
}: ColorTileProps) => {
  return (
    <div
      className={cn(styles.colorTile, className, {
        [styles.hasEmoji]: !!emoji
      })}
      onClick={() => goToRoute(link)}
      style={{
        boxShadow: `0 2px 8px -2px ${shadow}`,
        background: gradient
      }}
    >
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
      {emoji && <i className={`emoji xl ${emoji}`} />}
      {icon && <div className={styles.icon}>{icon}</div>}
      {isIncentivized ? (
        <div className={styles.rewardsPill}>
          <IconDigitalcoinRewardsPill />
        </div>
      ) : null}
    </div>
  )
}

export default ColorTile
