import type { ReactNode } from 'react'
import { useContext } from 'react'

import type { LinkingOptions } from '@react-navigation/native'
import {
  getStateFromPath,
  NavigationContainer as RNNavigationContainer
} from '@react-navigation/native'
import { getAccountUser } from '@coliving/web/src/common/store/account/selectors'

import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import type { RootScreenParamList } from 'app/screens/rootScreen/rootScreen'

import { ThemeContext } from '../theme/themeContext'

import { navigationThemes } from './navigationThemes'

type Props = {
  children: ReactNode
}
/**
 * NavigationContainer contains the react-navigation context
 * and configures linking
 */
const NavigationContainer = ({ children }: Props) => {
  const { theme, isSystemDarkMode } = useContext(ThemeContext)
  const pushRouteWeb = usePushRouteWeb()
  const account = useSelectorWeb(getAccountUser)

  const navigationTheme =
    theme === 'auto' ? (isSystemDarkMode ? 'dark' : 'default') : theme

  const linking: LinkingOptions<RootScreenParamList> = {
    prefixes: [
      'https://.co',
      'http://.co',
      'https://staging..co',
      'http://staging..co'
    ],
    // configuration for matching screens with paths
    config: {
      screens: {
        App: {
          screens: {
            MainStack: {
              initialRouteName: 'feed',
              screens: {
                feed: {
                  initialRouteName: 'Feed',
                  screens: {
                    Feed: 'feed',
                    Collection: '*/contentList/*',
                    DigitalContent: 'digital_content',
                    // Unfortunately routes like username/contentLists
                    // don't load properly on web. So for now deep linking
                    // to profile tabs (other than for your own account) isn't
                    // implemented
                    Profile: {
                      path: ':handle',
                      screens: {
                        Agreements: 'agreements',
                        Albums: 'albums',
                        ContentLists: 'contentLists',
                        Reposts: 'reposts',
                        Collectibles: 'collectibles'
                      }
                    } as any // Nested navigator typing with own params is broken, see: https://github.com/react-navigation/react-navigation/issues/9897
                  }
                },
                trending: {
                  initialRouteName: 'Trending',
                  screens: {
                    Trending: 'trending'
                  }
                },
                explore: {
                  initialRouteName: 'Explore',
                  screens: {
                    Explore: 'explore',
                    TrendingContentLists: 'explore/contentLists',
                    TrendingUnderground: 'explore/underground',
                    LetThemDJ: 'explore/let-them-dj',
                    TopAlbums: 'explore/top-albums',
                    UnderTheRadar: 'explore/under-the-radar',
                    BestNewReleases: 'explore/best-new-releases',
                    Remixables: 'explore/remixables',
                    MostLoved: 'explore/most-loved',
                    FeelingLucky: 'explore/feeling-lucky',
                    HeavyRotation: 'explore/heavy-rotation',
                    ChillContentLists: 'explore/chill',
                    IntenseContentLists: 'explore/intense',
                    IntimateContentLists: 'explore/intimate',
                    ProvokingContentLists: 'explore/provoking',
                    UpbeatContentLists: 'explore/upbeat'
                  }
                },
                favorites: {
                  screens: {
                    Favorites: 'favorites'
                  }
                },
                profile: {
                  screens: {
                    UserProfile: {
                      path: 'profile',
                      screens: {
                        Agreements: 'agreements',
                        Albums: 'albums',
                        ContentLists: 'contentLists',
                        Reposts: 'reposts',
                        Collectibles: 'collectibles'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    getStateFromPath: (path, options) => {
      // Strip the trending query param because `/trending` will
      // always go to ThisWeek
      if (path.match(/^\/trending/)) {
        path = '/trending'
      }

      pushRouteWeb(path, undefined, false)

      if (path.match(`^/${account?.handle}(/|$)`)) {
        // If the path is the current user and set path as `/profile`
        path = path.replace(`/${account?.handle}`, '/profile')
      } else {
        // If the path has two parts
        if (path.match(/^\/[^/]+\/[^/]+$/)) {
          // If the path is to digitalcoin-nft-content-list, reroute to feed
          if (path.match(/^\/[^/]+\/digitalcoin-nft-content-list$/)) {
            path = '/feed'
          }
          // If the path doesn't match a profile tab, it's a digital_content
          else if (
            !path.match(
              /^\/[^/]+\/(agreements|albums|contentLists|reposts|collectibles)$/
            )
          ) {
            path = '/digital_content'
          }
        }
      }

      return getStateFromPath(path, options)
    }
  }

  return (
    <RNNavigationContainer
      linking={linking}
      theme={navigationThemes[navigationTheme]}
    >
      {children}
    </RNNavigationContainer>
  )
}

export default NavigationContainer
