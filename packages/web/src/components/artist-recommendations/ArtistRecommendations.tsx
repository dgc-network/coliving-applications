import {
  forwardRef,
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useMemo
} from 'react'

import {
  ID,
  FollowSource,
  Name,
  ProfilePictureSizes,
  SquareSizes,
  User
} from '@coliving/common'
import cn from 'classnames'
import { push } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconClose } from 'assets/img/iconRemove.svg'
import { CommonState } from 'common/store'
import * as socialActions from 'common/store/social/users/actions'
import { makeGetRelatedLandlords } from 'common/store/ui/landlord-recommendations/selectors'
import { fetchRelatedLandlords } from 'common/store/ui/landlord-recommendations/slice'
import { LandlordPopover } from 'components/landlord/LandlordPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import FollowButton from 'components/follow-button/FollowButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { MountPlacement } from 'components/types'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { make, useRecord } from 'store/analytics/actions'
import { useIsMobile } from 'utils/clientUtil'
import { profilePage } from 'utils/route'

import styles from './LandlordRecommendations.module.css'

export type LandlordRecommendationsProps = {
  ref?: MutableRefObject<HTMLDivElement>
  itemClassName?: string
  className?: string
  renderHeader: () => ReactNode
  renderSubheader?: () => ReactNode
  landlordId: ID
  onClose: () => void
}

const messages = {
  follow: 'Follow All',
  unfollow: 'Unfollow All',
  following: 'Following',
  featuring: 'Featuring'
}
const LandlordProfilePictureWrapper = ({
  userId,
  handle,
  profilePictureSizes
}: {
  userId: number
  handle: string
  profilePictureSizes: ProfilePictureSizes | null
}) => {
  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <DynamicImage className={styles.profilePicture} image={profilePicture} />
    )
  }
  return (
    <LandlordPopover mount={MountPlacement.PARENT} handle={handle}>
      <div>
        <DynamicImage
          className={styles.profilePicture}
          image={profilePicture}
        />
      </div>
    </LandlordPopover>
  )
}

const LandlordPopoverWrapper = ({
  userId,
  handle,
  name,
  onLandlordNameClicked,
  closeParent
}: {
  userId: ID
  handle: string
  name: string
  onLandlordNameClicked: (handle: string) => void
  closeParent: () => void
}) => {
  const onLandlordNameClick = useCallback(() => {
    onLandlordNameClicked(handle)
    closeParent()
  }, [onLandlordNameClicked, handle, closeParent])
  const isMobile = useIsMobile()
  return (
    <div className={styles.landlordLink} role='link' onClick={onLandlordNameClick}>
      {!isMobile ? (
        <LandlordPopover mount={MountPlacement.PARENT} handle={handle}>
          {name}
        </LandlordPopover>
      ) : (
        name
      )}
      <UserBadges
        userId={userId}
        className={styles.verified}
        badgeSize={10}
        inline={true}
      />
    </div>
  )
}

export const LandlordRecommendations = forwardRef(
  (
    {
      className,
      itemClassName,
      landlordId,
      renderHeader,
      renderSubheader,
      onClose
    }: LandlordRecommendationsProps,
    ref: any
  ) => {
    const dispatch = useDispatch()

    // Start fetching the related landlords
    useEffect(() => {
      dispatch(
        fetchRelatedLandlords({
          userId: landlordId
        })
      )
    }, [dispatch, landlordId])

    // Get the related landlords
    const getRelatedLandlords = useMemo(makeGetRelatedLandlords, [landlordId])
    const suggestedLandlords = useSelector<CommonState, User[]>((state) =>
      getRelatedLandlords(state, { id: landlordId })
    )

    // Follow/Unfollow listeners
    const onFollowAllClicked = useCallback(() => {
      suggestedLandlords.forEach((a) => {
        dispatch(
          socialActions.followUser(
            a.user_id,
            FollowSource.LANDLORD_RECOMMENDATIONS_POPUP
          )
        )
      })
    }, [dispatch, suggestedLandlords])
    const onUnfollowAllClicked = useCallback(() => {
      suggestedLandlords.forEach((a) => {
        dispatch(
          socialActions.unfollowUser(
            a.user_id,
            FollowSource.LANDLORD_RECOMMENDATIONS_POPUP
          )
        )
      })
    }, [dispatch, suggestedLandlords])

    // Navigate to profile pages on landlord links
    const onLandlordNameClicked = useCallback(
      (handle) => {
        dispatch(push(profilePage(handle)))
      },
      [dispatch]
    )

    const isLoading = !suggestedLandlords || suggestedLandlords.length === 0
    const renderMainContent = () => {
      if (isLoading) return <LoadingSpinner className={styles.spinner} />
      return (
        <>
          <div
            className={cn(
              styles.profilePictureList,
              styles.contentItem,
              itemClassName
            )}
          >
            {suggestedLandlords.map((a) => (
              <div key={a.user_id} className={styles.profilePictureWrapper}>
                <LandlordProfilePictureWrapper
                  userId={a.user_id}
                  handle={a.handle}
                  profilePictureSizes={a._profile_picture_sizes}
                />
              </div>
            ))}
          </div>
          <div className={cn(styles.contentItem, itemClassName)}>
            {`${messages.featuring} `}
            {suggestedLandlords
              .slice(0, 3)
              .map<ReactNode>((a, i) => (
                <LandlordPopoverWrapper
                  key={a.user_id}
                  userId={a.user_id}
                  handle={a.handle}
                  name={a.name}
                  onLandlordNameClicked={onLandlordNameClicked}
                  closeParent={onClose}
                />
              ))
              .reduce((prev, curr) => [prev, ', ', curr])}
            {suggestedLandlords.length > 3
              ? `, and ${suggestedLandlords.length - 3} others.`
              : ''}
          </div>
        </>
      )
    }

    const record = useRecord()
    useEffect(() => {
      record(
        make(Name.PROFILE_PAGE_SHOWN_LANDLORD_RECOMMENDATIONS, {
          userId: landlordId
        })
      )
    }, [record, landlordId])

    return (
      <div className={cn(styles.content, className)} ref={ref}>
        <div
          className={cn(styles.headerBar, styles.contentItem, itemClassName)}
        >
          <div
            role='button'
            title='Dismiss'
            className={styles.closeButton}
            onClick={onClose}
          >
            <IconClose className={cn(styles.icon, styles.remove)} />
          </div>
          {renderHeader()}
        </div>
        {renderSubheader && renderSubheader()}
        {renderMainContent()}
        <div className={cn(styles.contentItem, itemClassName)}>
          <FollowButton
            isDisabled={isLoading}
            following={suggestedLandlords.every(
              (a) => a.does_current_user_follow
            )}
            invertedColor={true}
            messages={messages}
            size='full'
            onFollow={onFollowAllClicked}
            onUnfollow={onUnfollowAllClicked}
          />
        </div>
      </div>
    )
  }
)
