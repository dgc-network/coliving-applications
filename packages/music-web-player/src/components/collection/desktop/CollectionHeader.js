import { PureComponent, useState, useEffect } from 'react'

import { Variant, SquareSizes, SmartCollectionVariant } from '@coliving/common'
import {
  Button,
  ButtonType,
  IconPause,
  IconPlay,
  IconRepost,
  IconHeart,
  IconKebabHorizontal,
  IconShare,
  IconPencil,
  IconRocket
} from '@coliving/stems'
import cn from 'classnames'
import Linkify from 'linkifyjs/react'
import PropTypes from 'prop-types'

import { ReactComponent as IconFilter } from 'assets/img/iconFilter.svg'
import { squashNewLines } from 'common/utils/formatUtil'
import { formatSecondsAsText, formatDate } from 'common/utils/timeUtil'
import { LandlordPopover } from 'components/author/landlordPopover'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import { Input } from 'components/input'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import Menu from 'components/menu/menu'
import RepostFavoritesStats from 'components/repostFavoritesStats/repostFavoritesStats'
import Skeleton from 'components/skeleton/skeleton'
import Toast from 'components/toast/toast'
import Tooltip from 'components/tooltip/tooltip'
import InfoLabel from 'components/digital_content/InfoLabel'
import UserBadges from 'components/userBadges/userBadges'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'

import styles from './CollectionHeader.module.css'

const BUTTON_COLLAPSE_WIDTHS = {
  first: 1148,
  second: 1184,
  third: 1274,
  fourth: 1374
}

// Toast timeouts in ms
const REPOST_TIMEOUT = 1000

const messages = {
  shareButton: 'SHARE',
  repostButton: 'REPOST',
  repostButtonReposted: 'REPOSTED',
  favoriteButton: 'FAVORITE',
  favoriteButtonFavorited: 'FAVORITED',
  editButton: 'EDIT',
  publishButton: 'MAKE PUBLIC',
  publishingButton: 'PUBLISHING',
  reposted: 'Reposted!',
  repost: 'Repost',
  unrepost: 'Unrepost',
  favorite: 'Favorite',
  unfavorite: 'Unfavorite',
  contentListViewable: 'Your contentList can now be viewed by others!',
  filter: 'Filter DigitalContents'
}

const PlayButton = (props) => {
  return props.playing ? (
    <Button
      className={cn(
        styles.playAllButton,
        styles.buttonSpacing,
        styles.buttonFormatting
      )}
      textClassName={styles.buttonTextFormatting}
      type={ButtonType.PRIMARY_ALT}
      text='PAUSE'
      leftIcon={<IconPause />}
      onClick={props.onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      minWidth={132}
    />
  ) : (
    <Button
      className={cn(styles.playAllButton, styles.buttonSpacing)}
      textClassName={styles.buttonTextFormatting}
      type={ButtonType.PRIMARY_ALT}
      text='PLAY'
      leftIcon={<IconPlay />}
      onClick={props.onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      minWidth={132}
    />
  )
}

const repostButtonText = (isReposted) =>
  isReposted ? messages.repostButtonReposted : messages.repostButton
const favoriteButtonText = (isFavorited) =>
  isFavorited ? messages.favoriteButtonFavorited : messages.favoriteButton

const ViewerHasDigitalContentsButtons = (props) => {
  return (
    <>
      <PlayButton playing={props.playing} onPlay={props.onPlay} />
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.COMMON}
        text={messages.shareButton}
        leftIcon={<IconShare />}
        onClick={props.onShare}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
      <Toast
        text={messages.reposted}
        disabled={props.isReposted}
        delay={REPOST_TIMEOUT}
        fillParent={false}
      >
        <Tooltip
          disabled={props.isOwner || props.reposts === 0}
          text={props.isReposted ? messages.unrepost : messages.repost}
        >
          <div className={styles.buttonSpacing}>
            <Button
              type={props.isReposted ? ButtonType.SECONDARY : ButtonType.COMMON}
              className={styles.buttonFormatting}
              textClassName={styles.buttonTextFormatting}
              text={repostButtonText(props.isReposted)}
              leftIcon={<IconRepost />}
              onClick={props.onRepost}
              widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
            />
          </div>
        </Tooltip>
      </Toast>
      <Tooltip
        disabled={props.isOwner || props.saves === 0}
        text={props.isSaved ? messages.unfavorite : messages.favorite}
      >
        <div className={styles.buttonSpacing}>
          <Button
            type={props.isSaved ? ButtonType.SECONDARY : ButtonType.COMMON}
            className={styles.buttonFormatting}
            textClassName={styles.buttonTextFormatting}
            text={favoriteButtonText(props.isSaved)}
            leftIcon={<IconHeart />}
            onClick={props.onSave}
            widthToHideText={BUTTON_COLLAPSE_WIDTHS.fourth}
          />
        </div>
      </Tooltip>
      <span>
        <Menu {...props.overflowMenu}>
          {(ref, triggerPopup) => (
            <div className={cn(styles.buttonSpacing)} ref={ref}>
              <Button
                className={cn(styles.buttonFormatting)}
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
    </>
  )
}

const ViewerNoDigitalContentsButtons = (props) => {
  return (
    <>
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.DISABLED}
        text={messages.shareButton}
        leftIcon={<IconShare />}
        onClick={props.onShare}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.DISABLED}
        text={repostButtonText(props.isReposted)}
        leftIcon={<IconRepost />}
        onClick={props.onRepost}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.DISABLED}
        text={favoriteButtonText(props.isSaved)}
        leftIcon={<IconHeart />}
        onClick={props.onSave}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.fourth}
      />
      <span>
        <Menu {...props.overflowMenu}>
          {(ref, triggerPopup) => (
            <div className={cn(styles.buttonSpacing)} ref={ref}>
              <Button
                className={cn(styles.buttonFormatting)}
                leftIcon={<IconKebabHorizontal />}
                textClassName={styles.buttonTextFormatting}
                text={null}
                onClick={triggerPopup}
                type={ButtonType.COMMON}
                widthToHideText={1400}
              />
            </div>
          )}
        </Menu>
      </span>
    </>
  )
}

const SmartCollectionButtons = (props) => {
  return (
    <>
      <PlayButton playing={props.playing} onPlay={props.onPlay} />
      {/* Audio NFT ContentList share button */}
      {props.contentListId === SmartCollectionVariant.LIVE_NFT_CONTENT_LIST ? (
        <Button
          className={cn(styles.buttonSpacing, styles.buttonFormatting)}
          textClassName={styles.buttonTextFormatting}
          type={ButtonType.COMMON}
          text={messages.shareButton}
          leftIcon={<IconShare />}
          onClick={props.onShare}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
        />
      ) : null}
      {props.onSave ? (
        <Tooltip
          disabled={props.isOwner || props.saves === 0}
          text={props.isSaved ? messages.unfavorite : messages.favorite}
        >
          <div className={styles.buttonSpacing}>
            <Button
              className={cn(styles.buttonSpacing, styles.buttonFormatting)}
              textClassName={styles.buttonTextFormatting}
              type={props.isSaved ? ButtonType.SECONDARY : ButtonType.COMMON}
              text={favoriteButtonText(props.isSaved)}
              leftIcon={<IconHeart />}
              onClick={props.onSave}
              widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
            />
          </div>
        </Tooltip>
      ) : null}
    </>
  )
}

const OwnerNoDigitalContentsButtons = (props) => {
  return (
    <>
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.COMMON}
        text={messages.editButton}
        leftIcon={<IconPencil />}
        onClick={props.onEdit}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
    </>
  )
}

const OwnerNotPublishedButtons = (props) => {
  return (
    <>
      <PlayButton playing={props.playing} onPlay={props.onPlay} />
      {props.isAlbum ? null : (
        <Button
          className={cn(styles.buttonSpacing, styles.buttonFormatting)}
          textClassName={styles.buttonTextFormatting}
          type={props.isPublishing ? ButtonType.DISABLED : ButtonType.COMMON}
          text={
            props.isPublishing
              ? messages.publishingButton
              : messages.publishButton
          }
          leftIcon={
            props.isPublishing ? (
              <LoadingSpinner className={styles.spinner} />
            ) : (
              <IconRocket />
            )
          }
          onClick={props.isPublishing ? () => {} : props.onPublish}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
        />
      )}
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.COMMON}
        text={messages.editButton}
        leftIcon={<IconPencil />}
        onClick={props.onEdit}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
    </>
  )
}

const OwnerPublishedButtons = (props) => {
  const [showShareableToast, setShowShareableToast] = useState(false)

  const { isPublished, isPreviouslyUnpublished, unsetPreviouslyPublished } =
    props
  useEffect(() => {
    if (isPublished && isPreviouslyUnpublished) {
      setShowShareableToast(true)
      setTimeout(() => {
        setShowShareableToast(false)
        unsetPreviouslyPublished()
      }, 3000)
    }
  }, [isPreviouslyUnpublished, isPublished, unsetPreviouslyPublished])

  return (
    <>
      <PlayButton playing={props.playing} onPlay={props.onPlay} />
      <Toast
        text={messages.contentListViewable}
        fillParent={false}
        placement='top'
        firesOnClick={false}
        open={showShareableToast}
      >
        <Button
          className={cn(styles.buttonSpacing, styles.buttonFormatting)}
          textClassName={styles.buttonTextFormatting}
          type={ButtonType.COMMON}
          text={messages.shareButton}
          leftIcon={<IconShare />}
          onClick={props.onShare}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
        />
      </Toast>
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.COMMON}
        text={messages.editButton}
        leftIcon={<IconPencil />}
        onClick={props.onEdit}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      <span>
        <Menu {...props.overflowMenu}>
          {(ref, triggerPopup) => (
            <div className={cn(styles.buttonSpacing)} ref={ref}>
              <Button
                className={cn(styles.buttonFormatting)}
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
    </>
  )
}

const Buttons = (props) => {
  const overflowMenuExtraItems = []
  if (!props.isOwner) {
    overflowMenuExtraItems.push({
      text: props.isFollowing ? 'Unfollow User' : 'Follow User',
      onClick: () =>
        setTimeout(
          () => (props.isFollowing ? props.onUnfollow() : props.onFollow()),
          0
        )
    })
  }

  const overflowMenu = {
    menu: {
      type: props.type,
      contentListId: props.contentListId,
      contentListName: props.contentListName,
      handle: props.ownerHandle,
      isFavorited: props.isSaved,
      mount: 'page',
      isOwner: props.isOwner,
      includeEmbed: true,
      includeSave: false,
      includeVisitPage: false,
      isPublic: props.isPublished,
      extraMenuItems: overflowMenuExtraItems
    }
  }

  const buttonProps = {
    ...props,
    overflowMenu
  }

  let buttons
  if (props.variant === Variant.SMART) {
    buttons = <SmartCollectionButtons {...buttonProps} />
  } else {
    if (props.isOwner) {
      if (props.hasDigitalContents && props.isPublished) {
        buttons = <OwnerPublishedButtons {...buttonProps} />
      } else if (props.hasDigitalContents && !props.isPublished) {
        buttons = <OwnerNotPublishedButtons {...buttonProps} />
      } else {
        buttons = <OwnerNoDigitalContentsButtons {...buttonProps} />
      }
    } else {
      if (props.hasDigitalContents) {
        buttons = <ViewerHasDigitalContentsButtons {...buttonProps} />
      } else {
        buttons = <ViewerNoDigitalContentsButtons {...buttonProps} />
      }
    }
  }
  return buttons
}

const Artwork = ({
  collectionId,
  coverArtSizes,
  callback,
  gradient,
  icon: Icon,
  imageOverride
}) => {
  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000
  )
  useEffect(() => {
    // If there's a gradient, this is a smart collection. Just immediately call back
    if (image || gradient || imageOverride) callback()
  }, [image, callback, gradient, imageOverride])

  return (
    <div className={styles.coverArtWrapper}>
      <DynamicImage
        className={styles.coverArt}
        image={gradient || imageOverride || image}
      >
        {Icon && (
          <Icon className={styles.imageIcon} style={{ background: gradient }} />
        )}
      </DynamicImage>
    </div>
  )
}

class CollectionHeader extends PureComponent {
  state = {
    filterText: '',
    // Stores state if the user publishes the contentList this "session"
    previouslyUnpublished: false,
    artworkLoading: true
  }

  unsetPreviouslyPublished = () => {
    this.setState({ previouslyUnpublished: false })
  }

  onFilterChange = (e) => {
    const newFilterText = e.target.value
    this.setState({
      filterText: newFilterText
    })
    this.props.onFilterChange(e)
  }

  onPublish = () => {
    this.setState({ previouslyUnpublished: true })
    this.props.onPublish()
  }

  onArtworkLoad = () => {
    this.setState({ artworkLoading: false })
  }

  renderStatsRow = (isLoading) => {
    if (isLoading) return null
    const { reposts, saves, onClickReposts, onClickFavorites } = this.props
    return (
      <RepostFavoritesStats
        isUnlisted={false}
        repostCount={reposts}
        saveCount={saves}
        onClickReposts={onClickReposts}
        onClickFavorites={onClickFavorites}
        className={styles.statsWrapper}
      />
    )
  }

  render() {
    const {
      collectionId,
      type,
      title,
      coverArtSizes,
      landlordName,
      landlordHandle,
      description,
      isOwner,
      isAlbum,
      modified,
      numDigitalContents,
      duration,
      isPublished,
      isPublishing,
      digitalContentsLoading,
      loading,
      playing,
      isReposted,
      isSaved,
      isFollowing,
      reposts,
      saves,
      onClickLandlordName,
      onClickDescriptionExternalLink,
      onPlay,
      onEdit,
      onShare,
      onSave,
      onRepost,
      onFollow,
      onUnfollow,
      variant,
      gradient,
      icon,
      imageOverride,
      userId
    } = this.props
    const { artworkLoading } = this.state
    const isLoading = loading || artworkLoading

    const fadeIn = {
      [styles.show]: !isLoading,
      [styles.hide]: isLoading
    }

    return (
      <div className={styles.collectionHeader}>
        <div className={styles.topSection}>
          <Artwork
            collectionId={collectionId}
            coverArtSizes={coverArtSizes}
            callback={this.onArtworkLoad}
            gradient={gradient}
            icon={icon}
            imageOverride={imageOverride}
          />
          <div className={styles.infoSection}>
            <div className={cn(styles.typeLabel, fadeIn)}>
              {type === 'contentList' && !isPublished ? 'private contentList' : type}
            </div>
            <div className={styles.title}>
              <h1 className={cn(fadeIn)}>{title}</h1>
              {isLoading && <Skeleton className={styles.skeleton} />}
            </div>
            {landlordName && (
              <div className={styles.landlordWrapper}>
                <div className={cn(fadeIn)}>
                  <span>By</span>
                  <LandlordPopover handle={landlordHandle}>
                    <h2 className={styles.author} onClick={onClickLandlordName}>
                      {landlordName}
                      <UserBadges
                        userId={userId}
                        badgeSize={16}
                        className={styles.verified}
                      />
                    </h2>
                  </LandlordPopover>
                </div>
                {isLoading && (
                  <Skeleton className={styles.skeleton} width='60%' />
                )}
              </div>
            )}
            <div className={cn(styles.infoLabelsSection, fadeIn)}>
              {modified && (
                <InfoLabel
                  className={styles.infoLabelPlacement}
                  labelName='modified'
                  labelValue={formatDate(modified)}
                />
              )}
              {duration ? (
                <InfoLabel
                  className={styles.infoLabelPlacement}
                  labelName='duration'
                  labelValue={formatSecondsAsText(duration)}
                />
              ) : null}
              <InfoLabel
                className={styles.infoLabelPlacement}
                labelName='digitalContents'
                labelValue={numDigitalContents}
              />
            </div>
            <div className={cn(styles.description, fadeIn)}>
              <Linkify
                options={{
                  attributes: { onClick: onClickDescriptionExternalLink }
                }}
              >
                {squashNewLines(description)}
              </Linkify>
            </div>
            <div className={cn(styles.statsRow, fadeIn)}>
              {this.renderStatsRow(isLoading)}
            </div>
            <div
              className={cn(styles.buttonSection, {
                [styles.show]: !digitalContentsLoading,
                [styles.hide]: digitalContentsLoading
              })}
            >
              {!digitalContentsLoading && (
                <Buttons
                  variant={variant}
                  contentListId={collectionId}
                  contentListName={title}
                  isOwner={isOwner}
                  type={type}
                  ownerHandle={landlordHandle}
                  isAlbum={isAlbum}
                  hasDigitalContents={numDigitalContents > 0}
                  isPublished={isPublished}
                  isPreviouslyUnpublished={this.state.previouslyUnpublished}
                  unsetPreviouslyPublished={this.unsetPreviouslyPublished}
                  isPublishing={isPublishing}
                  playing={playing}
                  isReposted={isReposted}
                  isSaved={isSaved}
                  isFollowing={isFollowing}
                  reposts={reposts}
                  saves={saves}
                  shareClicked={this.shareClicked}
                  onPlay={onPlay}
                  onEdit={onEdit}
                  onPublish={this.onPublish}
                  onShare={onShare}
                  onSave={onSave}
                  onRepost={onRepost}
                  onFollow={onFollow}
                  onUnfollow={onUnfollow}
                />
              )}
            </div>
          </div>
          {this.props.onFilterChange ? (
            <div className={styles.inputWrapper}>
              <Input
                placeholder={messages.filter}
                prefix={<IconFilter />}
                onChange={this.onFilterChange}
                value={this.state.filterText}
                size='small'
                variant='bordered'
              />
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}

CollectionHeader.propTypes = {
  collectionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  index: PropTypes.number,
  loading: PropTypes.bool,
  digitalContentsLoading: PropTypes.bool,
  playing: PropTypes.bool,
  active: PropTypes.bool,
  type: PropTypes.oneOf(['contentList', 'album']),
  title: PropTypes.string,
  landlordName: PropTypes.string,
  landlordHandle: PropTypes.string,
  coverArtSizes: PropTypes.object,
  tags: PropTypes.array,
  description: PropTypes.string,
  userId: PropTypes.number,

  isOwner: PropTypes.bool,
  isAlbum: PropTypes.bool,
  hasDigitalContents: PropTypes.bool,
  isPublished: PropTypes.bool,
  isPublishing: PropTypes.bool,
  isSaved: PropTypes.bool,
  reposts: PropTypes.number,
  saves: PropTypes.number,

  // Actions
  onClickLandlordName: PropTypes.func,
  onFilterChange: PropTypes.func,
  onPlay: PropTypes.func,
  onEdit: PropTypes.func,
  onClickDescriptionExternalLink: PropTypes.func,

  // Smart collection
  variant: PropTypes.any, // CollectionVariant
  gradient: PropTypes.string,
  icon: PropTypes.any,
  imageOverride: PropTypes.string
}

CollectionHeader.defaultProps = {
  index: 0,
  loading: false,
  playing: false,
  active: true,
  type: 'contentList',
  tags: [],
  description: '',

  isOwner: false,
  isAlbum: false,
  hasDigitalContents: false,
  isPublished: false,
  isPublishing: false,
  isSaved: false,

  reposts: 0,
  saves: 0,

  onPlay: () => {},
  onEdit: () => {}
}

export default CollectionHeader
