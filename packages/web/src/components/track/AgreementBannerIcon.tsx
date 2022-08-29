import cn from 'classnames'

import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'
import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'

import styles from './AgreementBannerIcon.module.css'

export enum AgreementBannerIconType {
  STAR = 'star',
  HIDDEN = 'hidden'
}

const AgreementBannerIcon = ({
  type,
  isMobile,
  isMatrixMode
}: {
  type: AgreementBannerIconType
  isMobile?: boolean
  isMatrixMode: boolean
}) => {
  const renderIcon = () => {
    switch (type) {
      case AgreementBannerIconType.STAR:
        return <IconStar />
      case AgreementBannerIconType.HIDDEN:
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
          [styles.star]: type === AgreementBannerIconType.STAR,
          [styles.hidden]: type === AgreementBannerIconType.HIDDEN
        })}
      />
      {renderIcon()}
    </div>
  )
}

export default AgreementBannerIcon
