import { memo } from 'react'

import FavoriteButton from 'components/altButton/favoriteButton'
import MoreButton from 'components/altButton/moreButton'
import RepostButton from 'components/altButton/repostButton'
import ShareButton from 'components/altButton/shareButton'

import styles from './BottomButtons.module.css'

type BottomButtonsProps = {
  hasSaved: boolean
  hasReposted: boolean
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  isOwner: boolean
  isDarkMode: boolean
  isUnlisted?: boolean
  isShareHidden?: boolean
  isMatrixMode: boolean
}

const BottomButtons = (props: BottomButtonsProps) => {
  const repostButton = () => {
    return (
      <RepostButton
        onClick={() => props.toggleRepost()}
        isActive={props.hasReposted}
        isDisabled={props.isOwner}
        isUnlisted={props.isUnlisted}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
    )
  }

  const favoriteButton = () => {
    return (
      <FavoriteButton
        onClick={() => props.toggleSave()}
        isActive={props.hasSaved}
        isDisabled={props.isOwner}
        isUnlisted={props.isUnlisted}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
    )
  }

  const shareButton = () => {
    return (
      <ShareButton
        onClick={props.onShare}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
        isShareHidden={props.isShareHidden}
      />
    )
  }

  const moreButton = () => {
    return (
      <MoreButton
        onClick={props.onClickOverflow}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
    )
  }

  return props.isUnlisted ? (
    <div className={styles.bottomButtons}>
      {shareButton()}
      {moreButton()}
    </div>
  ) : (
    <div className={styles.bottomButtons}>
      {repostButton()}
      {favoriteButton()}
      {shareButton()}
      {moreButton()}
    </div>
  )
}

export default memo(BottomButtons)
