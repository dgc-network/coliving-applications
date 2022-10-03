import { memo, useEffect } from 'react'

import { ID, Color, ProfilePictureSizes, SquareSizes } from '@coliving/common'
import cn from 'classnames'
import { animated, useSpring } from 'react-spring'

import Draggable from 'components/dragndrop/draggable'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import UserBadges from 'components/userBadges/userBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { fullAgreementPage } from 'utils/route'

import styles from './PlayingAgreementInfo.module.css'

interface PlayingAgreementInfoProps {
  agreementId: number
  isOwner: boolean
  agreementTitle: string
  agreementPermalink: string
  profilePictureSizes: ProfilePictureSizes
  isVerified: boolean
  isAgreementUnlisted: boolean
  landlordUserId: ID
  landlordName: string
  landlordHandle: string
  hasShadow: boolean
  dominantColor?: Color
  onClickAgreementTitle: () => void
  onClickLandlordName: () => void
}

const springProps = {
  from: { opacity: 0.6 },
  to: { opacity: 1 },
  reset: true,
  config: { tension: 240, friction: 25 }
}

const PlayingAgreementInfo = ({
  agreementId,
  isOwner,
  agreementTitle,
  agreementPermalink,
  profilePictureSizes,
  landlordUserId,
  landlordName,
  onClickAgreementTitle,
  onClickLandlordName,
  isAgreementUnlisted,
  hasShadow,
  dominantColor
}: PlayingAgreementInfoProps) => {
  const [landlordSpringProps, setLandlordSpringProps] = useSpring(() => springProps)
  const [agreementSpringProps, setAgreementSpringProps] = useSpring(() => springProps)
  const image = useUserProfilePicture(
    landlordUserId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  useEffect(() => {
    setLandlordSpringProps(springProps)
  }, [landlordUserId, setLandlordSpringProps])

  useEffect(() => {
    setAgreementSpringProps(springProps)
  }, [agreementTitle, setAgreementSpringProps])

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
            [styles.isDefault]: !!agreementId
          })}
          imageStyle={boxShadowStyle}
          usePlaceholder={false}
        />
      </div>
      <div className={styles.text}>
        <Draggable
          isDisabled={!agreementTitle || isAgreementUnlisted}
          text={agreementTitle}
          isOwner={isOwner}
          kind='agreement'
          id={agreementId}
          link={fullAgreementPage(agreementPermalink)}
        >
          <animated.div style={agreementSpringProps}>
            <div
              className={cn(styles.agreementTitle, {
                [styles.textShadow]: hasShadow
              })}
              onClick={onClickAgreementTitle}
            >
              {agreementTitle}
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

export default memo(PlayingAgreementInfo)
