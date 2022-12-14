import { useCallback } from 'react'

import { ID, Name, FeatureFlags } from '@coliving/common'
import cn from 'classnames'
import { animated } from 'react-spring'

import { useSelector } from 'common/hooks/useSelector'
import { getAccountUser } from 'common/store/account/selectors'
import Input from 'components/dataEntry/input'
import TextArea from 'components/dataEntry/textArea'
import { SupportingList } from 'components/tipping/support/supportingList'
import { TopSupporters } from 'components/tipping/support/topSupporters'
import { TipAudioButton } from 'components/tipping/tipDigitalcoin/tipDigitalcoinButton'
import { OpacityTransition } from 'components/transitionContainer/opacityTransition'
import UploadChip from 'components/upload/uploadChip'
import ProfilePageBadge from 'components/userBadges/profilePageBadge'
import { Type } from 'pages/profilePage/components/socialLink'
import SocialLinkInput from 'pages/profilePage/components/socialLinkInput'
import { ProfileTags } from 'pages/profilePage/components/desktop/profileTags'
import { getFeatureEnabled } from 'services/remoteConfig/featureFlagHelpers'
import { make, useRecord } from 'store/analytics/actions'
import { UPLOAD_PAGE } from 'utils/route'

import { ProfileBio } from './profileBio'
import { ProfileMutuals } from './profileMutuals'
import styles from './profilePage.module.css'

const messages = {
  aboutYou: 'About You',
  description: 'Description',
  location: 'Location',
  socialHandles: 'Social Handles',
  website: 'Website',
  donate: 'Donate'
}

type ProfileLeftNavProps = {
  userId: ID
  handle: string
  isLandlord: boolean
  created: string
  editMode: boolean
  loading: boolean
  isDeactivated: boolean
  goToRoute: (route: string) => void
  twitterHandle: string
  onUpdateTwitterHandle: (handle: string) => void
  instagramHandle: string
  onUpdateInstagramHandle: (handle: string) => void
  tikTokHandle: string
  onUpdateTikTokHandle: (handle: string) => void
  website: string
  onUpdateWebsite: (website: string) => void
  location: string
  onUpdateLocation: (location: string) => void
  donation: string
  onUpdateDonation: (donation: string) => void
  bio: string
  onUpdateBio: (bio: string) => void
  twitterVerified: boolean
  instagramVerified: boolean
  tags: string[]
  isOwner: boolean
}

export const ProfileLeftNav = (props: ProfileLeftNavProps) => {
  const {
    userId,
    handle,
    isLandlord,
    created,
    editMode,
    loading,
    isDeactivated,
    goToRoute,
    twitterHandle,
    onUpdateTwitterHandle,
    instagramHandle,
    onUpdateInstagramHandle,
    tikTokHandle,
    onUpdateTikTokHandle,
    website,
    onUpdateWebsite,
    location,
    onUpdateLocation,
    donation,
    onUpdateDonation,
    bio,
    onUpdateBio,
    twitterVerified,
    instagramVerified,
    tags,
    isOwner
  } = props

  const record = useRecord()
  const isTippingEnabled = getFeatureEnabled(FeatureFlags.TIPPING_ENABLED)
  const accountUser = useSelector(getAccountUser)

  const onClickUploadChip = useCallback(() => {
    goToRoute(UPLOAD_PAGE)
    record(make(Name.DIGITAL_CONTENT_UPLOAD_OPEN, { source: 'profile' }))
  }, [goToRoute, record])

  const renderTipAudioButton = (_: any, style: object) => (
    <animated.div className={styles.tipAudioButtonContainer} style={style}>
      <TipAudioButton />
    </animated.div>
  )

  if (editMode) {
    return (
      <div className={styles.edit}>
        <div className={styles.editLabel}>{messages.aboutYou}</div>
        <div className={styles.editField}>
          <TextArea
            className={styles.descriptionInput}
            size='small'
            grows
            placeholder={messages.description}
            defaultValue={bio || ''}
            onChange={onUpdateBio}
          />
        </div>
        <div className={styles.editField}>
          <Input
            className={styles.locationInput}
            characterLimit={30}
            size='small'
            placeholder={messages.location}
            defaultValue={location || ''}
            onChange={onUpdateLocation}
          />
        </div>
        <div className={cn(styles.editLabel, styles.section)}>
          {messages.socialHandles}
        </div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={twitterHandle}
            isDisabled={!!twitterVerified}
            className={styles.twitterInput}
            type={Type.TWITTER}
            onChange={onUpdateTwitterHandle}
          />
        </div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={instagramHandle}
            className={styles.instagramInput}
            isDisabled={!!instagramVerified}
            type={Type.INSTAGRAM}
            onChange={onUpdateInstagramHandle}
          />
        </div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={tikTokHandle}
            className={styles.tikTokInput}
            type={Type.TIKTOK}
            onChange={onUpdateTikTokHandle}
          />
        </div>
        <div className={cn(styles.editLabel, styles.section)}>
          {messages.website}
        </div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={website}
            className={styles.websiteInput}
            type={Type.WEBSITE}
            onChange={onUpdateWebsite}
          />
        </div>
        <div className={cn(styles.editLabel, styles.section)}>
          {messages.donate}
        </div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={donation}
            className={styles.donationInput}
            type={Type.DONATION}
            onChange={onUpdateDonation}
            textLimitMinusLinks={32}
          />
        </div>
      </div>
    )
  } else if (!loading && !isDeactivated) {
    return (
      <div className={styles.about}>
        <ProfilePageBadge userId={userId} className={styles.badge} />
        <ProfileBio
          handle={handle}
          bio={bio}
          location={location}
          website={website}
          donation={donation}
          created={created}
          twitterHandle={twitterHandle}
          instagramHandle={instagramHandle}
          tikTokHandle={tikTokHandle}
        />
        {isTippingEnabled &&
        (!accountUser || accountUser.user_id !== userId) ? (
          <OpacityTransition render={renderTipAudioButton} />
        ) : null}
        {isTippingEnabled && <SupportingList />}
        {isTippingEnabled && <TopSupporters />}
        {isLandlord ? <ProfileTags goToRoute={goToRoute} tags={tags} /> : null}
        <ProfileMutuals />
        {isOwner && !isLandlord && (
          <UploadChip type='digital_content' variant='nav' onClick={onClickUploadChip} />
        )}
      </div>
    )
  } else {
    return null
  }
}
