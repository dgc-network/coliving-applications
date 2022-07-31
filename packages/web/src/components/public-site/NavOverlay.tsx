import { useEffect, useState } from 'react'

import {
  IconCampFire,
  IconDiscord,
  IconDownload,
  IconExplore,
  IconFollow,
  IconInstagram,
  IconRemove,
  IconTrending,
  IconTwitterBird
} from '@coliving/stems'
import cn from 'classnames'
import ReactDOM from 'react-dom'

import HeroBackground from 'assets/img/publicSite/Hero-BG@2x.jpg'
import HorizontalLogo from 'assets/img/publicSite/Horizontal-Logo-Full-Color@2x.png'
import {
  COLIVING_BLOG_LINK,
  COLIVING_DISCORD_LINK,
  COLIVING_DOCS_LINK,
  COLIVING_EXPLORE_LINK,
  COLIVING_HOT_AND_NEW,
  COLIVING_INSTAMGRAM_LINK,
  COLIVING_LISTENING_LINK,
  COLIVING_ORG,
  COLIVING_PRESS_LINK,
  COLIVING_REMIX_CONTESTS_LINK,
  COLIVING_SIGN_UP_LINK,
  COLIVING_TEAM_LINK,
  COLIVING_TWITTER_LINK,
  DOWNLOAD_START_LINK,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE
} from 'utils/route'

import styles from './NavOverlay.module.css'
import { handleClickRoute } from './handleClickRoute'

const messages = {
  startListening: 'Start Listening'
}

const socialLinks = [
  {
    Icon: IconInstagram,
    link: COLIVING_INSTAMGRAM_LINK
  },
  {
    Icon: IconTwitterBird,
    link: COLIVING_TWITTER_LINK
  },
  {
    Icon: IconDiscord,
    link: COLIVING_DISCORD_LINK
  }
]

const dappLinks = [
  {
    text: 'Sign Up',
    icon: <IconFollow className={styles.dappLinkIcon} />,
    link: COLIVING_SIGN_UP_LINK
  },
  {
    text: 'Trending',
    icon: <IconTrending className={styles.dappLinkIcon} />,
    link: COLIVING_LISTENING_LINK
  },
  {
    text: 'Explore',
    icon: <IconExplore className={styles.dappLinkIcon} />,
    link: COLIVING_EXPLORE_LINK
  },
  {
    text: 'Hot & New',
    icon: <IconCampFire className={styles.dappLinkIcon} />,
    link: COLIVING_HOT_AND_NEW
  },
  {
    text: 'Download App',
    icon: <IconDownload className={styles.dappLinkIcon} />,
    link: DOWNLOAD_START_LINK
  }
]

const links = [
  {
    text: 'Blog',
    link: COLIVING_BLOG_LINK
  },
  {
    text: 'Docs',
    link: COLIVING_DOCS_LINK
  },
  {
    text: 'Privacy Policy',
    link: PRIVACY_POLICY
  },
  {
    text: 'Remixes',
    link: COLIVING_REMIX_CONTESTS_LINK
  },
  {
    text: 'Team',
    link: COLIVING_TEAM_LINK
  },
  {
    text: 'Terms of Service',
    link: TERMS_OF_SERVICE
  },
  {
    text: 'Token',
    link: COLIVING_ORG
  },
  {
    text: 'Brand',
    link: COLIVING_PRESS_LINK
  }
]

type NavOverlayProps = {
  isOpen: boolean
  closeNavScreen: () => void
  setRenderPublicSite: (shouldRender: boolean) => void
}

const rootId = 'navOverlay'

const useModalRoot = () => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let el = document.getElementById(rootId)
    if (el) {
      setModalRoot(el)
    } else {
      el = document.createElement('div')
      el.id = rootId
      document.body.appendChild(el)
      setModalRoot(el)
    }
  }, [])

  return modalRoot
}

const NavOverlay = (props: NavOverlayProps) => {
  const onStartListening = () => {
    props.closeNavScreen()
    handleClickRoute(COLIVING_LISTENING_LINK, props.setRenderPublicSite)()
  }

  const modalRoot = useModalRoot()

  return (
    modalRoot &&
    ReactDOM.createPortal(
      <div
        className={cn(styles.container, {
          [styles.hide]: !props.isOpen
        })}
      >
        <div
          className={cn(styles.backgroundContainer)}
          style={{
            backgroundImage: `url(${HeroBackground})`
          }}
        >
          <div className={cn(styles.background)}></div>
        </div>
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <IconRemove
              className={styles.iconClose}
              onClick={props.closeNavScreen}
            />
            <img
              src={HorizontalLogo}
              className={styles.horizontalLogo}
              alt='Coliving Logo'
            />
          </div>
          <div className={styles.dappLinksContainer}>
            <div className={styles.dappLinks}>
              {dappLinks.map(({ icon, text, link }, idx) => (
                <a
                  key={idx}
                  onClick={handleClickRoute(link, props.setRenderPublicSite)}
                  className={styles.dappLink}
                  href={link}
                >
                  {icon}
                  <h4 className={styles.dappLinkText}>{text}</h4>
                </a>
              ))}
            </div>
          </div>
          <div className={styles.startListeningButtonContainer}>
            <button
              className={styles.startListeningButton}
              onClick={onStartListening}
            >
              {messages.startListening}
            </button>
          </div>
          <div className={styles.iconsContainer}>
            {socialLinks.map(({ Icon, link }, idx) => (
              <a
                key={idx}
                href={link}
                onClick={handleClickRoute(link, props.setRenderPublicSite)}
              >
                <Icon className={styles.icon} />
              </a>
            ))}
          </div>
          <div className={styles.linksContainer}>
            {links.map(({ text, link }, idx) => (
              <a
                key={idx}
                onClick={handleClickRoute(link, props.setRenderPublicSite)}
                className={styles.link}
                href={link}
              >
                {text}
              </a>
            ))}
          </div>
        </div>
      </div>,
      modalRoot
    )
  )
}

export default NavOverlay
