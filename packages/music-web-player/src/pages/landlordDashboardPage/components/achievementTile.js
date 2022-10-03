import { memo } from 'react'

import { ReactComponent as IconTrophy } from 'assets/img/iconTrophy.svg'

import styles from './achievementTile.module.css'

const getAchievement = () => {
  // TODO: Use some information about the landlord to calculate the 'achievement'
  return { value: '300', valueLabel: 'th', label: 'Most Played' }
}

const AchievementTile = (props) => {
  const { value, valueLabel, label } = getAchievement(props.landlordStats)
  return (
    <div className={styles.achievementTileContainer}>
      <IconTrophy className={styles.achievementTrophy} />
      <div className={styles.achievementDescription}>
        <div className={styles.achievementMetric}>
          <span className={styles.achievementValue}>{value}</span>
          {valueLabel && (
            <span className={styles.achievementValueLabel}>{valueLabel}</span>
          )}
        </div>
        <span className={styles.achievementLabel}>{label}</span>
      </div>
    </div>
  )
}

export default memo(AchievementTile)
