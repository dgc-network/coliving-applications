import { PureComponent } from 'react'

import {
  Button,
  ButtonType,
  IconShare,
  IconRocket,
  IconRepost,
  IconHeart,
  IconPause,
  IconPlay,
  IconKebabHorizontal
} from '@coliving/stems'
import cn from 'classnames'
import Linkify from 'linkifyjs/react'
import PropTypes from 'prop-types'

import { squashNewLines } from 'common/utils/formatUtil'
import { getCanonicalName } from 'common/utils/genres'
import { formatDate, formatSeconds } from 'common/utils/timeUtil'
import { LandlordPopover } from 'components/author/landlordPopover'
import DownloadButtons from 'components/downloadButtons/downloadButtons'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import Menu from 'components/menu/menu'
import RepostFavoritesStats from 'components/repostFavoritesStats/repostFavoritesStats'
import Skeleton from 'components/skeleton/skeleton'
import Toast from 'components/toast/toast'
import Tooltip from 'components/tooltip/tooltip'
import UserBadges from 'components/userBadges/userBadges'
import HiddenDigitalContentHeader from 'pages/digital-content-page/components/HiddenDigitalContentHeader'
import { moodMap } from 'utils/moods'

import Badge from './badge'
import GiantArtwork from './giantArtwork'
import styles from './GiantDigitalContentTile.module.css'
import InfoLabel from './infoLabel'
import Tag from './tag'

const BUTTON_COLLAPSE_WIDTHS = {
  first: 1095,
  second: 1190,
  third: 1286
}

// Toast timeouts in ms
const REPOST_TIMEOUT = 1000
const SAVED_TIMEOUT = 1000

const messages = {
  digitalContentTitle: 'DIGITAL_CONTENT',
  remixTitle: 'REMIX',
  hiddenDigitalContentTooltip: 'Anyone with a link to this page will be able to see it',
  makePublic: 'MAKE PUBLIC',
  isPublishing: 'PUBLISHING',
  repostButtonText: 'repost',
  repostedButtonText: 'reposted'
}

class GiantDigitalContentTile extends PureComponent {
  state = {
    artworkLoading: true
  }

  renderCardTitle(className) {
    const { isUnlisted, isRemix } = this.props

    if (!isUnlisted) {
      return (
        <div className={cn(styles.headerContainer, className)}>
          <div className={styles.typeLabel}>
            {isRemix ? messages.remixTitle : messages.digitalContentTitle}
          </div>
        </div>
      )
    }

    return (
      <div className={cn(styles.headerContainer, className)}>
        <Tooltip
          text={messages.hiddenDigitalContentTooltip}
          mouseEnterDelay={0}
          shouldWrapContent={false}
        >
          <div>
            <HiddenDigitalContentHeader />
          </div>
        </Tooltip>
      </div>
    )
  }

  renderShareButton() {
    const { isUnlisted, isPublishing, fieldVisibility, onShare } = this.props
    const shouldShow = (!isUnlisted && !isPublishing) || fieldVisibility.share
    return (
      shouldShow && (
        <Button
          className={styles.buttonFormatting}
          textClassName={styles.buttonTextFormatting}
          type={ButtonType.COMMON}
          text='SHARE'
          leftIcon={<IconShare />}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
          onClick={onShare}
        />
      )
    )
  }

  renderMakePublicButton() {
    const { isUnlisted, isPublishing, makePublic, digitalContentId, isOwner } =
      this.props
    return (
      (isUnlisted || isPublishing) &&
      isOwner && (
        <Button
          className={cn(styles.buttonFormatting, styles.makePublicButton)}
          textClassName={styles.buttonTextFormatting}
          type={isPublishing ? ButtonType.DISABLED : ButtonType.COMMON}
          text={isPublishing ? messages.isPublishing : messages.makePublic}
          leftIcon={
            isPublishing ? (
              <LoadingSpinner className={styles.spinner} />
            ) : (
              <IconRocket />
            )
          }
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
          onClick={isPublishing ? () => {} : () => makePublic(digitalContentId)}
        />
      )
    )
  }

  renderRepostButton() {
    const {
      isUnlisted,
      isPublishing,
      isReposted,
      isOwner,
      repostCount,
      onRepost
    } = this.props
    return (
      !isUnlisted &&
      !isPublishing &&
      !isOwner && (
        <Toast
          placement='bottom'
          text={'Reposted!'}
          disabled={isReposted}
          delay={REPOST_TIMEOUT}
          fillParent={false}
        >
          <Tooltip
            disabled={isOwner || repostCount === 0}
            text={isReposted ? 'Unrepost' : 'Repost'}
          >
            <div>
              <Button
                name='repost'
                className={styles.buttonFormatting}
                textClassName={styles.buttonTextFormatting}
                type={
                  isOwner
                    ? ButtonType.DISABLED
                    : isReposted
                    ? ButtonType.SECONDARY
                    : ButtonType.COMMON
                }
                widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
                text={
                  isReposted
                    ? messages.repostedButtonText
                    : messages.repostButtonText
                }
                leftIcon={<IconRepost />}
                onClick={isOwner ? () => {} : onRepost}
              />
            </div>
          </Tooltip>
        </Toast>
      )
    )
  }

  renderFavoriteButton() {
    const { isUnlisted, isSaved, isOwner, onSave, saveCount } = this.props
    return (
      !isUnlisted &&
      !isOwner && (
        <Toast
          placement='bottom'
          text={'Favorited!'}
          disabled={isSaved}
          delay={SAVED_TIMEOUT}
          fillParent={false}
        >
          <Tooltip
            disabled={isOwner || saveCount === 0}
            text={isSaved ? 'Unfavorite' : 'Favorite'}
          >
            <div>
              <Button
                name='favorite'
                className={styles.buttonFormatting}
                textClassName={styles.buttonTextFormatting}
                type={
                  isOwner
                    ? ButtonType.DISABLED
                    : isSaved
                    ? ButtonType.SECONDARY
                    : ButtonType.COMMON
                }
                text={isSaved ? 'FAVORITED' : 'FAVORITE'}
                widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
                leftIcon={<IconHeart />}
                onClick={isOwner ? () => {} : onSave}
              />
            </div>
          </Tooltip>
        </Toast>
      )
    )
  }

  renderMood() {
    const { mood, isUnlisted, fieldVisibility } = this.props
    const shouldShow = !isUnlisted || fieldVisibility.mood
    return (
      shouldShow &&
      mood && (
        <InfoLabel
          className={styles.infoLabelPlacement}
          labelName='mood'
          labelValue={mood in moodMap ? moodMap[mood] : mood}
        />
      )
    )
  }

  renderGenre() {
    const { isUnlisted, fieldVisibility, genre } = this.props
    const shouldShow = !isUnlisted || fieldVisibility.genre

    return (
      shouldShow && (
        <InfoLabel
          className={styles.infoLabelPlacement}
          labelName='genre'
          labelValue={getCanonicalName(genre)}
        />
      )
    )
  }

  renderListenCount() {
    const { listenCount, isUnlisted, fieldVisibility } = this.props
    const shouldShow = !isUnlisted || fieldVisibility.play_count
    return (
      shouldShow && (
        <div className={styles.listens}>
          {listenCount === 0 ? (
            <span className={styles.firstListen}>
              Be the first to listen to this digital_content!
            </span>
          ) : (
            <>
              <span className={styles.numberOfListens}>
                {listenCount.toLocaleString()}
              </span>
              <span className={styles.listenText}>
                {listenCount === 1 ? 'Play' : 'Plays'}
              </span>
            </>
          )}
        </div>
      )
    )
  }

  renderTags() {
    const { isUnlisted, fieldVisibility, tags, onClickTag } = this.props
    const shouldShow = !isUnlisted || fieldVisibility.tags
    return (
      shouldShow &&
      tags && (
        <div className={styles.tagSection}>
          {tags
            .split(',')
            .filter((t) => t)
            .map((tag) => (
              <Tag
                className={styles.tagFormatting}
                textLabel={tag}
                key={tag}
                onClick={() => onClickTag(tag)}
              />
            ))}
        </div>
      )
    )
  }

  renderReleased() {
    const { isUnlisted, released } = this.props
    return (
      !isUnlisted &&
      released && (
        <InfoLabel
          className={styles.infoLabelPlacement}
          labelName='released'
          labelValue={formatDate(released)}
        />
      )
    )
  }

  renderStatsRow() {
    const {
      isUnlisted,
      repostCount,
      saveCount,
      onClickReposts,
      onClickFavorites
    } = this.props
    return (
      <RepostFavoritesStats
        isUnlisted={isUnlisted}
        repostCount={repostCount}
        saveCount={saveCount}
        onClickReposts={onClickReposts}
        onClickFavorites={onClickFavorites}
      />
    )
  }

  onArtworkLoad = () => {
    this.setState({ artworkLoading: false })
  }

  renderDownloadButtons = () => {
    return (
      <DownloadButtons
        className={styles.downloadButtonsContainer}
        digitalContentId={this.props.digitalContentId}
        isOwner={this.props.isOwner}
        following={this.props.following}
        onDownload={this.props.onDownload}
      />
    )
  }

  render() {
    const {
      playing,
      digitalContentId,
      digitalContentTitle,
      coverArtSizes,
      landlordName,
      landlordHandle,
      description,
      duration,
      credits,
      isOwner,
      isSaved,
      badge,
      onClickLandlordName,
      onPlay,
      following,
      onFollow,
      onUnfollow,
      isLandlordPick,
      isUnlisted,
      onExternalLinkClick,
      coSign,
      loading,
      userId
    } = this.props
    const { artworkLoading } = this.state

    const isLoading = loading || artworkLoading

    const overflowMenuExtraItems = []
    if (!isOwner) {
      overflowMenuExtraItems.push({
        text: following ? 'Unfollow Author' : 'Follow Author',
        onClick: () =>
          setTimeout(() => (following ? onUnfollow() : onFollow()), 0)
      })
    }

    const overflowMenu = {
      menu: {
        type: 'digital_content',
        digitalContentId,
        digitalContentTitle,
        handle: landlordHandle,
        isFavorited: isSaved,
        mount: 'page',
        isOwner,
        includeFavorite: false,
        includeDigitalContentPage: false,
        isLandlordPick,
        includeEmbed: !isUnlisted,
        includeLandlordPick: !isUnlisted,
        includeAddToContentList: !isUnlisted,
        extraMenuItems: overflowMenuExtraItems
      }
    }

    const fadeIn = {
      [styles.show]: !isLoading,
      [styles.hide]: isLoading
    }

    return (
      <div className={styles.giantDigitalContentTile}>
        <div className={styles.topSection}>
          <GiantArtwork
            digitalContentId={digitalContentId}
            coverArtSizes={coverArtSizes}
            coSign={coSign}
            callback={this.onArtworkLoad}
          />
          <div className={styles.infoSection}>
            <div className={styles.infoSectionHeader}>
              {this.renderCardTitle(fadeIn)}
              <div className={styles.title}>
                <h1 className={cn(fadeIn)}>{digitalContentTitle}</h1>
                {isLoading && <Skeleton className={styles.skeleton} />}
              </div>
              <div className={styles.landlordWrapper}>
                <div className={cn(fadeIn)}>
                  <span>By</span>
                  <LandlordPopover handle={landlordHandle}>
                    <h2 className={styles.author} onClick={onClickLandlordName}>
                      {landlordName}
                      <UserBadges
                        className={styles.verified}
                        badgeSize={18}
                        userId={userId}
                      />
                    </h2>
                  </LandlordPopover>
                </div>
                {isLoading && (
                  <Skeleton className={styles.skeleton} width='60%' />
                )}
              </div>
            </div>

            <div className={cn(styles.playSection, fadeIn)}>
              <Button
                name='play'
                className={styles.playButton}
                textClassName={styles.playButtonText}
                type={ButtonType.PRIMARY_ALT}
                text={playing ? 'PAUSE' : 'PLAY'}
                leftIcon={playing ? <IconPause /> : <IconPlay />}
                onClick={onPlay}
              />
              {this.renderListenCount()}
            </div>

            <div className={cn(styles.statsSection, fadeIn)}>
              {this.renderStatsRow()}
            </div>

            <div
              className={cn(styles.commonButtonSection, fadeIn)}
              role='group'
              aria-label='digital_content actions'
            >
              {this.renderShareButton()}
              {this.renderMakePublicButton()}
              {this.renderRepostButton()}
              {this.renderFavoriteButton()}
              <span>
                <Menu {...overflowMenu}>
                  {(ref, triggerPopup) => (
                    <div className={cn(styles.menuKebabContainer)} ref={ref}>
                      <Button
                        className={cn(
                          styles.buttonFormatting,
                          styles.moreButton
                        )}
                        leftIcon={<IconKebabHorizontal />}
                        onClick={triggerPopup}
                        text={null}
                        textClassName={styles.buttonTextFormatting}
                        type={ButtonType.COMMON}
                      />
                    </div>
                  )}
                </Menu>
              </span>
            </div>
          </div>
          {badge ? (
            <Badge className={styles.badgePlacement} textLabel={badge} />
          ) : null}
        </div>

        <div className={cn(styles.bottomSection, fadeIn)}>
          <div className={styles.infoLabelsSection}>
            <InfoLabel
              className={styles.infoLabelPlacement}
              labelName='duration'
              labelValue={`${formatSeconds(duration)}`}
            />
            {this.renderReleased()}
            {this.renderGenre()}
            {this.renderMood()}
            {credits ? (
              <InfoLabel
                className={styles.infoLabelPlacement}
                labelName='credit'
                labelValue={credits}
              />
            ) : null}
          </div>
          {description ? (
            <Linkify options={{ attributes: { onClick: onExternalLinkClick } }}>
              <h3 className={styles.description}>
                {squashNewLines(description)}
              </h3>
            </Linkify>
          ) : null}
          {this.renderTags()}
          {this.renderDownloadButtons()}
        </div>
      </div>
    )
  }
}

GiantDigitalContentTile.propTypes = {
  currentUserId: PropTypes.number,
  userId: PropTypes.number,
  loading: PropTypes.bool,
  playing: PropTypes.bool,
  active: PropTypes.bool,
  digitalContentTitle: PropTypes.string,
  digitalContentId: PropTypes.number,
  landlordName: PropTypes.string,
  landlordHandle: PropTypes.string,
  coverArtSizes: PropTypes.object,
  tags: PropTypes.string,
  description: PropTypes.string,
  listenCount: PropTypes.number,
  duration: PropTypes.number,
  released: PropTypes.string,
  credits: PropTypes.string,
  genre: PropTypes.string,
  mood: PropTypes.string,
  repostCount: PropTypes.number,
  saveCount: PropTypes.number,
  isOwner: PropTypes.bool,
  isReposted: PropTypes.bool,
  isSaved: PropTypes.bool,
  isDownloadable: PropTypes.bool,
  badge: PropTypes.string,
  isUnlisted: PropTypes.bool,
  isRemix: PropTypes.bool,
  isPublishing: PropTypes.bool,
  fieldVisibility: PropTypes.object,
  coSign: PropTypes.object,
  // Actions
  onClickLandlordName: PropTypes.func,
  onPlay: PropTypes.func,
  onShare: PropTypes.func,
  onRepost: PropTypes.func,
  onSave: PropTypes.func,
  following: PropTypes.bool,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func,
  onDownload: PropTypes.func
}

GiantDigitalContentTile.defaultProps = {
  loading: false,
  playing: false,
  active: true,
  tags: '',
  description: '',
  listenCount: 0,
  duration: 0,
  released: '',
  credits: '',
  genre: '',
  mood: '',
  repostCount: 0,
  saveCount: 0,
  isOwner: true,
  isReposted: false,
  isSaved: false,
  badge: '',
  // Actions
  onClickLandlordName: () => {},
  onPlay: () => {},
  onShare: () => {},
  onRepost: () => {},
  onSave: () => {},
  onFollow: () => {},
  onDownload: () => {}
}

export default GiantDigitalContentTile
