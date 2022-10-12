import { memo, useEffect } from 'react'

import { ID, Color, ProfilePictureSizes, SquareSizes } from '@coliving/common'
import cn from 'classnames'
import { animated, useSpring } from 'react-spring'

import Draggable from 'components/dragndrop/draggable'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import UserBadges from 'components/userBadges/userBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { fullDigitalContentPage } from 'utils/route'

import styles from './PlayingDigitalContentInfo.module.css'

interface PlayingDigitalContentInfoProps {
  digitalContentId: number
  isOwner: boolean
  digitalContentTitle: string
  digitalContentPermalink: string
  profilePictureSizes: ProfilePictureSizes
  isVerified: boolean
  isDigitalContentUnlisted: boolean
  landlordUserId: ID
  landlordName: string
  landlordHandle: string
  hasShadow: boolean
  dominantColor?: Color
  onClickDigitalContentTitle: () => void
  onClickLandlordName: () => void
}

const springProps = {
  from: { opacity: 0.6 },
  to: { opacity: 1 },
  reset: true,
  config: { tension: 240, friction: 25 }
}

const PlayingDigitalContentInfo = ({
  digitalContentId,
  isOwner,
  digitalContentTitle,
  digitalContentPermalink,
  profilePictureSizes,
  landlordUserId,
  landlordName,
  onClickDigitalContentTitle,
  onClickLandlordName,
  isDigitalContentUnlisted,
  hasShadow,
  dominantColor
}: PlayingDigitalContentInfoProps) => {
  const [landlordSpringProps, setLandlordSpringProps] = useSpring(() => springProps)
  const [digitalContentSpringProps, setDigitalContentSpringProps] = useSpring(() => springProps)
  const image = useUserProfilePicture(
    landlordUserId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  useEffect(() => {
    setLandlordSpringProps(springProps)
  }, [landlordUserId, setLandlordSpringProps])

  useEffect(() => {
    setDigitalContentSpringProps(springProps)
  }, [digitalContentTitle, setDigitalContentSpringProps])

  const boxShadowStyle =
    hasShadow && dominantColor
      ? {
          boxShadow: `0px 3px 5px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.5), 0px 3px 4px rgba(133, 129, 153, 0.25)`
        }
      : {}

  return (
    <div className={styles.info}>
      <div className={styles.profilePictureWrapper}>
        <DynamicImage
          image={image}
          onClick={onClickLandlordName}
          className={cn(styles.profilePicture, {
            [styles.isDefault]: !!digitalContentId
          })}
          imageStyle={boxShadowStyle}
          usePlaceholder={false}
        />
      </div>
      <div className={styles.text}>
        <Draggable
          isDisabled={!digitalContentTitle || isDigitalContentUnlisted}
          text={digitalContentTitle}
          isOwner={isOwner}
          kind='digital_content'
          id={digitalContentId}
          link={fullDigitalContentPage(digitalContentPermalink)}
        >
          <animated.div style={digitalContentSpringProps}>
            <div
              className={cn(styles.digitalContentTitle, {
                [styles.textShadow]: hasShadow
              })}
              onClick={onClickDigitalContentTitle}
            >
              {digitalContentTitle}
            </div>
          </animated.div>
        </Draggable>
        <animated.div
          className={styles.landlordNameWrapper}
          style={landlordSpringProps}
        >
          <div
            className={cn(styles.landlordName, {
              [styles.textShadow]: hasShadow
            })}
            onClick={onClickLandlordName}
          >
            {landlordName}
          </div>
          <UserBadges
            userId={landlordUserId}
            badgeSize={10}
            className={styles.iconVerified}
          />
        </animated.div>
      </div>
    </div>
  )
}

export default memo(PlayingDigitalContentInfo)
