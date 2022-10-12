import cn from 'classnames'

import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'
import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'

import styles from './DigitalContentBannerIcon.module.css'

export enum DigitalContentBannerIconType {
  STAR = 'star',
  HIDDEN = 'hidden'
}

const DigitalContentBannerIcon = ({
  type,
  isMobile,
  isMatrixMode
}: {
  type: DigitalContentBannerIconType
  isMobile?: boolean
  isMatrixMode: boolean
}) => {
  const renderIcon = () => {
    switch (type) {
      case DigitalContentBannerIconType.STAR:
        return <IconStar />
      case DigitalContentBannerIconType.HIDDEN:
        return <IconHidden />
    }
  }

  return (
    <div
      className={cn(styles.landlordPick, {
        [styles.isMobile]: isMobile,
        [styles.matrix]: isMatrixMode
      })}
    >
      <div
        className={cn(styles.container, {
          [styles.star]: type === DigitalContentBannerIconType.STAR,
          [styles.hidden]: type === DigitalContentBannerIconType.HIDDEN
        })}
      />
      {renderIcon()}
    </div>
  )
}

export default DigitalContentBannerIcon
