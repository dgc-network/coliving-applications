import { useEffect, useState } from 'react'

import { UserCollectionMetadata } from '@coliving/common'
import { useSpring, animated } from 'react-spring'
import { useAsyncFn } from 'react-use'

import colivingExclusivesContentListImg from 'assets/img/publicSite/ColivingExclusivesContentListArt.png'
import colivingWeeklyContentListImg from 'assets/img/publicSite/ColivingWeeklyContentListArt.png'
import hotAndNewContentListImg from 'assets/img/publicSite/HotAndNewContentListArt.jpeg'
import { ReactComponent as IconLines } from 'assets/img/publicSite/Lines.svg'
import moombahtonContentListImg from 'assets/img/publicSite/MoombahtonContentListArt.png'
import { ReactComponent as IconListenOnColiving } from 'assets/img/publicSite/listen-on-coliving.svg'
import { fetchExploreContent } from 'common/store/pages/explore/sagas'
import { handleClickRoute } from 'components/publicSite/handleClickRoute'
import useCardWeight from 'hooks/useCardWeight'
import useHasViewed from 'hooks/useHasViewed'
import ColivingBackend from 'services/colivingBackend'
import { getContentNodeIPFSGateways } from 'utils/gatewayUtil'
import { contentListPage } from 'utils/route'

import styles from './FeaturedContent.module.css'

const messages = {
  title: 'Featured Content',
  subTitle: 'Check out the contentLists we are listening to right now'
}

type ContentListTileProps = {
  title: string
  author: string
  imageUrl: string | null
  onClick: () => void
}

const FALLBACK_CONTENT_LISTS = [
  {
    title: 'Coliving Exclusives',
    author: 'Coliving',
    imageUrl: colivingExclusivesContentListImg,
    link: '/coliving/contentList/official-coliving-exclusives-1428'
  },
  {
    title: 'MOOMBAHTON COMES TO COLIVING',
    author: 'Moombahton',
    imageUrl: moombahtonContentListImg,
    link: '/moombahton/contentList/moombahton-comes-to-coliving-9601'
  },
  {
    title: 'Hot & New On Coliving 🔥',
    author: 'Coliving',
    imageUrl: hotAndNewContentListImg,
    link: '/coliving/contentList/hot-new-on-coliving-%F0%9F%94%A5-4281'
  },
  {
    title: 'Coliving Weekly',
    author: 'Coliving',
    imageUrl: colivingWeeklyContentListImg,
    link: '/3lau/is-it-love-feat.-yeah-boy-1151'
  }
]

const DesktopContentListTile = (props: ContentListTileProps) => {
  const [cardRef, onMove, onLeave, transform] = useCardWeight({
    sensitivity: 1.8
  })
  const [mouseDown, setMouseDown] = useState(false)
  return (
    <div
      className={styles.digitalContentMoveContainer}
      ref={cardRef}
      // @ts-ignore
      onClick={props.onClick}
      onMouseMove={onMove}
      onMouseLeave={() => {
        onLeave()
        setMouseDown(false)
      }}
      onMouseUp={() => setMouseDown(false)}
      onMouseDown={() => setMouseDown(true)}
    >
      <animated.div
        className={styles.digitalContentContainer}
        // @ts-ignore
        style={{ transform: mouseDown ? '' : transform }}
      >
        <div
          className={styles.digital_content}
          style={{
            backgroundImage: `url(${props.imageUrl})`,
            boxShadow: `0px 10px 50px -2px rgba(56, 14, 13, 0.4)`
          }}
        >
          <div className={styles.digitalContent}>
            <div className={styles.digitalContentLandlord}>{`By ${props.author}`}</div>
            <IconListenOnColiving className={styles.listenOnColiving} />
          </div>
        </div>
      </animated.div>
      <div className={styles.digitalContentTitleContainer}>
        <span className={styles.digitalContentTitle}>{props.title}</span>
      </div>
    </div>
  )
}

const MobileContentListTile = (props: ContentListTileProps) => (
  <div
    key={props.title}
    className={styles.digitalContentContainer}
    onClick={props.onClick}
  >
    <div
      className={styles.digitalContentImage}
      style={{
        backgroundImage: `url(${
          props.imageUrl || colivingExclusivesContentListImg
        })`,
        boxShadow: `0px 10px 50px -2px rgba(56, 14, 13, 0.4)`
      }}
    ></div>
    <div className={styles.digitalContentTitle}>{props.title}</div>
  </div>
)

type FeaturedContentProps = {
  isMobile: boolean
  setRenderPublicSite: (shouldRender: boolean) => void
}

const getImageUrl = (
  size: 'small' | 'large',
  { cover_art, cover_art_sizes }: UserCollectionMetadata,
  contentNodeEndpoint: string | null
) => {
  const gateways = getContentNodeIPFSGateways(contentNodeEndpoint)
  const cNode = gateways[0]
  if (cover_art_sizes) {
    return `${cNode}${cover_art_sizes}/${
      size === 'small' ? '150x150' : '1000x1000'
    }.jpg`
  } else if (cover_art_sizes) {
    return `${cNode}${cover_art}`
  } else {
    return null
  }
}

const FeaturedContent = (props: FeaturedContentProps) => {
  const [trendingContentListsResponse, fetchTrendingContentLists] =
    useAsyncFn(async () => {
      const featuredContent = await fetchExploreContent()
      const ids = featuredContent.featuredContentLists
      const contentLists = ColivingBackend.getContentLists(
        null,
        ids
      ) as any as UserCollectionMetadata[]
      return contentLists
    }, [])

  useEffect(() => {
    fetchTrendingContentLists()
  }, [fetchTrendingContentLists])
  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed(0.8)

  const textStyles = useSpring({
    config: { mass: 3, tension: 2000, friction: 500 },
    opacity: hasViewed ? 1 : 0,
    x: hasViewed ? 0 : 150
  })

  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <h3 className={styles.title}>{messages.title}</h3>
        <h4 className={styles.subTitle}>{messages.subTitle}</h4>
        <div className={styles.digitalContentsContainer}>
          {trendingContentListsResponse.value == null ||
          trendingContentListsResponse.value.length < 4
            ? FALLBACK_CONTENT_LISTS.map((p) => (
                <MobileContentListTile
                  key={p.link}
                  {...p}
                  onClick={handleClickRoute(p.link, props.setRenderPublicSite)}
                />
              ))
            : trendingContentListsResponse.value
                .slice(0, 4)
                .map((p) => (
                  <MobileContentListTile
                    key={p.content_list_id}
                    title={p.content_list_name}
                    author={p.user.name}
                    imageUrl={getImageUrl(
                      'small',
                      p,
                      p.user.content_node_endpoint
                    )}
                    onClick={handleClickRoute(
                      contentListPage(
                        p.user.handle,
                        p.content_list_name,
                        p.content_list_id
                      ),
                      props.setRenderPublicSite
                    )}
                  />
                ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={refInView}>
      <div className={styles.content}>
        <div className={styles.animateTitleContainer}>
          <animated.div
            style={{
              transform: textStyles.x.interpolate(
                (x) => `translate3d(0,${x}px,0)`
              )
            }}
          >
            <div className={styles.header}>
              <h3 className={styles.title}>{messages.title}</h3>
              <h4 className={styles.subTitle}>{messages.subTitle}</h4>
            </div>
          </animated.div>
        </div>
        <div className={styles.digitalContentsContainer}>
          {trendingContentListsResponse.value == null ||
          trendingContentListsResponse.value.length < 4
            ? FALLBACK_CONTENT_LISTS.map((p) => (
                <DesktopContentListTile
                  key={p.title}
                  {...p}
                  onClick={handleClickRoute(p.link, props.setRenderPublicSite)}
                />
              ))
            : trendingContentListsResponse.value
                .slice(0, 4)
                .map((p) => (
                  <DesktopContentListTile
                    key={p.content_list_id}
                    title={p.content_list_name}
                    author={p.user.name}
                    imageUrl={getImageUrl(
                      'large',
                      p,
                      p.user.content_node_endpoint
                    )}
                    onClick={handleClickRoute(
                      contentListPage(
                        p.user.handle,
                        p.content_list_name,
                        p.content_list_id
                      ),
                      props.setRenderPublicSite
                    )}
                  />
                ))}
        </div>
      </div>
      <IconLines className={styles.lines} />
    </div>
  )
}

export default FeaturedContent
