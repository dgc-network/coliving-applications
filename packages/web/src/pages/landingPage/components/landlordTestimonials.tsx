import { Parallax } from 'react-scroll-parallax'
import { useSpring, animated } from 'react-spring'

import landlord3lau from 'assets/img/publicSite/ImgLandlord3LAU.jpg'
import landlordAlinaBaraz from 'assets/img/publicSite/ImgLandlordAlinaBaraz.jpg'
import landlordDeadmau5 from 'assets/img/publicSite/ImgLandlordDeadmau5.jpg'
import landlordJasonDerulo from 'assets/img/publicSite/ImgLandlordJasonDerulo.jpg'
import landlordKatyPerry from 'assets/img/publicSite/ImgLandlordKatyPerry.jpg'
import landlordNas from 'assets/img/publicSite/ImgLandlordNas.jpg'
import landlordRezz from 'assets/img/publicSite/ImgLandlordREZZ.jpg'
import landlordSkrillex from 'assets/img/publicSite/ImgLandlordSkrillex.jpg'
import landlordSteveAoki from 'assets/img/publicSite/ImgLandlordSteveAoki.jpg'
import landlordChainsmokers from 'assets/img/publicSite/ImgLandlordTheChainsmokers.jpg'
import dots2x from 'assets/img/publicSite/dots@2x.jpg'
import useHasViewed from 'hooks/useHasViewed'

import styles from './LandlordTestimonials.module.css'

const messages = {
  title: 'Built With The Best',
  subtitle: 'We designed it with you in mind and with them by our side.'
}

type AristProps = {
  imageUrl: string
  name: string
}

const Landlord = (props: AristProps) => {
  return (
    <div className={styles.cardMoveContainer}>
      <div className={styles.landlordContainer}>
        <div className={styles.landlordImageWrapper}>
          <animated.img src={props.imageUrl} className={styles.landlordImage} />
        </div>
        <div className={styles.landlordName}>{props.name}</div>
      </div>
    </div>
  )
}

type MobileLandlordProps = {
  imageUrl: string
  name: string
}
const MobileLandlord = (props: MobileLandlordProps) => {
  return (
    <div className={styles.landlordCard}>
      <div className={styles.landlordImageWrapper}>
        <img
          src={props.imageUrl}
          className={styles.landlordImage}
          alt='Coliving Landlord'
        />
      </div>
      <div className={styles.landlordName}>{props.name}</div>
    </div>
  )
}

const MobileOverflowLandlord = (props: MobileLandlordProps) => {
  return (
    <div className={styles.overflowLandlordCard}>
      <img
        src={props.imageUrl}
        className={styles.landlordImage}
        alt='Coliving Landlord'
      />
    </div>
  )
}

const landlords = [
  {
    name: 'deadmau5',
    imageUrl: landlordDeadmau5
  },
  {
    name: 'Katy Perry',
    imageUrl: landlordKatyPerry
  },
  {
    name: 'Nas',
    imageUrl: landlordNas
  },
  {
    name: 'Jason Derulo',
    imageUrl: landlordJasonDerulo
  },
  {
    name: 'Steve Aoki',
    imageUrl: landlordSteveAoki
  },
  {
    name: 'SKRILLEX',
    imageUrl: landlordSkrillex
  },
  {
    name: 'REZZ',
    imageUrl: landlordRezz
  },
  {
    name: 'The Chainsmokers',
    imageUrl: landlordChainsmokers
  },
  {
    name: 'alina baraz',
    imageUrl: landlordAlinaBaraz
  },
  {
    name: '3LAU',
    imageUrl: landlord3lau
  }
]

type LandlordTestimonialsProps = {
  isMobile: boolean
}

const LandlordTestimonials = (props: LandlordTestimonialsProps) => {
  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed()
  // @ts-ignore
  const titleStyles = useSpring({
    config: { mass: 3, tension: 2000, friction: 500 },
    opacity: hasViewed ? 1 : 0,
    x: hasViewed ? 0 : 120
  })

  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <h3 className={styles.title}>{messages.title}</h3>
        <h3 className={styles.subTitle}>{messages.subtitle}</h3>
        <div className={styles.landlordsContainer}>
          {landlords.slice(0, -4).map((landlord, i) => (
            <MobileLandlord key={landlord.name} {...landlord} />
          ))}
        </div>
        <div className={styles.overflowLandlordsContainer}>
          {landlords.slice(-4).map((landlord) => (
            <MobileOverflowLandlord key={landlord.name} {...landlord} />
          ))}
        </div>
        <div className={styles.overflowLandlordsText}>&amp; so many more</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div ref={refInView} className={styles.content}>
        <div className={styles.foreground}>
          <div className={styles.animateTitleContainer}>
            <animated.div
              style={{
                opacity: titleStyles.opacity,
                // @ts-ignore
                transform: titleStyles.x.interpolate(
                  (x) => `translate3d(0,${x}px,0)`
                ),
                width: '100%'
              }}
            >
              <h3 className={styles.title}>{messages.title}</h3>
              <h3 className={styles.subTitle}>{messages.subtitle}</h3>
            </animated.div>
          </div>
          <div className={styles.landlordsContainer}>
            {landlords.map((landlord) => (
              <Landlord key={landlord.name} {...landlord} />
            ))}
          </div>
        </div>
        <Parallax
          y={[-15, 30]}
          styleInner={{
            position: 'absolute',
            top: '-70px',
            height: '100%'
          }}
        >
          <div
            className={styles.dotsBackground}
            style={{ backgroundImage: `url(${dots2x})` }}
          ></div>
        </Parallax>
      </div>
    </div>
  )
}

export default LandlordTestimonials
