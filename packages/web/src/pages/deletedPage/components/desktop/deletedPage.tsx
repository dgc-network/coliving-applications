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

import { LandlordPopover } from 'components/landlord/landlordPopover'
import CoverPhoto from 'components/coverPhoto/coverPhoto'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import Lineup, { LineupWithoutTile } from 'components/lineup/lineup'
import NavBanner from 'components/navBanner/navBanner'
import Page from 'components/page/page'
import StatBanner from 'components/statBanner/statBanner'
import UserBadges from 'components/userBadges/userBadges'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './deletedPage.module.css'

const messages = {
  agreementDeleted: 'Agreement [Deleted]',
  agreementDeletedByLandlord: 'Agreement [Deleted By Landlord]',
  contentListDeleted: 'ContentList [Deleted by Landlord]',
  albumDeleted: 'Album [Deleted By Landlord]',
  checkOut: (name: string) => `Check out more by ${name}`,
  moreBy: (name: string) => `More by ${name}`
}

const AgreementArt = ({
  agreementId,
  coverArtSizes
}: {
  agreementId: ID
  coverArtSizes: CoverArtSizes
}) => {
  const image = useAgreementCoverArt(
    agreementId,
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
    user,
    deletedByLandlord = true,
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
      ? messages.agreementDeletedByLandlord
      : messages.agreementDeleted

    const renderTile = () => {
      return (
        <div className={styles.tile}>
          {playable.type === PlayableType.CONTENT_LIST ||
          playable.type === PlayableType.ALBUM ? (
            <CollectionArt
              collectionId={playable.metadata.content_list_id}
              coverArtSizes={playable.metadata._cover_art_sizes}
            />
          ) : (
            <AgreementArt
              agreementId={playable.metadata.agreement_id}
              coverArtSizes={playable.metadata._cover_art_sizes}
            />
          )}
          <div className={styles.rightSide}>
            <div className={styles.type}>{headingText}</div>
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
                <h2 className={styles.landlord} onClick={goToLandlordPage}>
                  {user.name}
                  <UserBadges
                    userId={user?.user_id}
                    badgeSize={16}
                    className={styles.verified}
                  />
                </h2>
              </LandlordPopover>
            </div>
            <div>
              <Button
                textClassName={styles.buttonText}
                text={messages.checkOut(user.name)}
                type={ButtonType.COMMON}
                leftIcon={<IconUser />}
                onClick={goToLandlordPage} css={undefined}              />
            </div>
          </div>
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
      <Page
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        variant='flush'
        scrollableSearch
      >
        <div className={styles.headerWrapper}>
          <CoverPhoto
            userId={user ? user.user_id : null}
            coverPhotoSizes={user ? user._cover_photo_sizes : null}
          />
          <StatBanner empty />
          <NavBanner empty />
        </div>
        <div className={styles.contentWrapper}>
          {renderTile()}
          {renderLineup()}
        </div>
      </Page>
    )
  }
)

export default DeletedPage