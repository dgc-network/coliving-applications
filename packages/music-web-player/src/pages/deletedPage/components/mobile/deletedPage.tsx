import {
  ID,
  PlayableType,
  CoverArtSizes,
  SquareSizes,
  Playable,
  User,
  NestedNonNullable
} from '@coliving/common'
import { Button, ButtonType, IconUser } from '@coliving/stems'

import { LandlordPopover } from 'components/author/landlordPopover'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import Lineup, { LineupWithoutTile } from 'components/lineup/lineup'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import UserBadges from 'components/userBadges/userBadges'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useDigitalContentCoverArt } from 'hooks/useDigitalContentCoverArt'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './deletedPage.module.css'

const messages = {
  digitalContentDeleted: 'DigitalContent [Deleted]',
  digitalContentDeletedByLandlord: 'DigitalContent [Deleted By Author]',
  contentListDeleted: 'ContentList [Deleted by Author]',
  albumDeleted: 'Album [Deleted By Author]',
  checkOut: (name: string) => `Check out more by ${name}`,
  moreBy: (name: string) => `More by ${name}`
}

const DigitalContentArt = ({
  digitalContentId,
  coverArtSizes
}: {
  digitalContentId: ID
  coverArtSizes: CoverArtSizes
}) => {
  const image = useDigitalContentCoverArt(
    digitalContentId,
    coverArtSizes,
    SquareSizes.SIZE_480_BY_480
  )
  return <DynamicImage wrapperClassName={styles.image} image={image} />
}

const CollectionArt = ({
  collectionId,
  coverArtSizes
}: {
  collectionId: ID
  coverArtSizes: CoverArtSizes
}) => {
  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_480_BY_480
  )
  return <DynamicImage wrapperClassName={styles.image} image={image} />
}

export type DeletedPageProps = {
  title: string
  description: string
  canonicalUrl: string
  deletedByLandlord: boolean

  playable: Playable
  user: User | null
  getLineupProps: () => LineupWithoutTile
  goToLandlordPage: () => void
}

const g = withNullGuard(
  ({ playable, user, ...p }: DeletedPageProps) =>
    playable?.metadata &&
    user && { ...p, playable: playable as NestedNonNullable<Playable>, user }
)

const DeletedPage = g(
  ({
    title,
    description,
    canonicalUrl,
    playable,
    deletedByLandlord = true,
    user,
    getLineupProps,
    goToLandlordPage
  }) => {
    const isContentList =
      playable.type === PlayableType.CONTENT_LIST ||
      playable.type === PlayableType.ALBUM
    const isAlbum = playable.type === PlayableType.ALBUM

    const headingText = isContentList
      ? isAlbum
        ? messages.albumDeleted
        : messages.contentListDeleted
      : deletedByLandlord
      ? messages.digitalContentDeletedByLandlord
      : messages.digitalContentDeleted

    const renderTile = () => {
      return (
        <div className={styles.tile}>
          <div className={styles.type}>{headingText}</div>
          {playable.type === PlayableType.CONTENT_LIST ||
          playable.type === PlayableType.ALBUM ? (
            <CollectionArt
              collectionId={playable.metadata.content_list_id}
              coverArtSizes={playable.metadata._cover_art_sizes}
            />
          ) : (
            <DigitalContentArt
              digitalContentId={playable.metadata.digital_content_id}
              coverArtSizes={playable.metadata._cover_art_sizes}
            />
          )}
          <div className={styles.title}>
            <h1>
              {playable.type === PlayableType.CONTENT_LIST ||
              playable.type === PlayableType.ALBUM
                ? playable.metadata.content_list_name
                : playable.metadata.title}
            </h1>
          </div>
          <div className={styles.landlordWrapper}>
            <span>By</span>
            <LandlordPopover handle={user.handle}>
              <h2 className={styles.author} onClick={goToLandlordPage}>
                {user.name}
                <UserBadges
                  userId={user.user_id}
                  badgeSize={16}
                  className={styles.verified}
                />
              </h2>
            </LandlordPopover>
          </div>
          <Button
            textClassName={styles.buttonText}
            text={messages.checkOut(user.name)}
            type={ButtonType.COMMON}
            leftIcon={<IconUser />}
            onClick={goToLandlordPage} css={undefined}          />
        </div>
      )
    }

    const renderLineup = () => {
      return (
        <div className={styles.lineupWrapper}>
          <div className={styles.lineupHeader}>{`${messages.moreBy(
            user.name
          )}`}</div>
          <Lineup {...getLineupProps()} />
        </div>
      )
    }

    return (
      <MobilePageContainer
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
      >
        <div className={styles.contentWrapper}>
          {renderTile()}
          {renderLineup()}
        </div>
      </MobilePageContainer>
    )
  }
)

export default DeletedPage
