import { useCallback } from 'react'

import { Theme, StringKeys } from '@coliving/common'
import { getTrendingRewardsModalType } from '@coliving/web/src/common/store/pages/digitalcoin-rewards/selectors'
import type { TrendingRewardsModalType } from '@coliving/web/src/common/store/pages/digitalcoin-rewards/slice'
import { setTrendingRewardsModalType } from '@coliving/web/src/common/store/pages/digitalcoin-rewards/slice'
import {
  TRENDING_PAGE,
  TRENDING_CONTENT_LISTS_PAGE,
  TRENDING_UNDERGROUND_PAGE
} from '@coliving/web/src/utils/route'
import type { ImageStyle } from 'react-native'
import { Image, ScrollView, View } from 'react-native'

import ChartIncreasing from 'app/assets/images/emojis/chart-increasing.png'
import IconArrow from 'app/assets/images/iconArrow.svg'
import {
  SegmentedControl,
  Text,
  GradientText,
  Button,
  Link
} from 'app/components/core'
import TweetEmbed from 'app/components/tweetEmbed'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import type { AppScreenParamList } from 'app/screens/appScreen'
import { makeStyles } from 'app/styles'
import { useThemeVariant } from 'app/utils/theme'

import { AppDrawer, useDrawerState } from '../drawer/appDrawer'

const TRENDING_REWARDS_DRAWER_NAME = 'TrendingRewardsExplainer'
const TOS_URL = 'https://blog..co/article/digitalcoin-rewards'

const messages = {
  digitalContentsTitle: 'Top 5 DigitalContents Each Week Receive 100 $DGC',
  contentListTitle: 'Top 5 ContentLists Each Week Receive 100 $DGC',
  undergroundTitle: 'Top 5 DigitalContents Each Week Receive 100 $DGC',
  winners: 'Winners are selected every Friday at Noon PT!',
  lastWeek: "LAST WEEK'S WINNERS",
  digitalContents: 'DIGITAL_CONTENTS',
  contentLists: 'CONTENT_LISTS',
  underground: 'UNDERGROUND',
  terms: 'Terms and Conditions Apply',
  digitalContentsModalTitle: 'Top 5 Trending DigitalContents',
  contentListsModalTitle: 'Top 5 Trending ContentLists',
  undergroundModalTitle: 'Top 5 Underground Trending DigitalContents',
  buttonTextDigitalContents: 'Trending DigitalContents',
  buttonTextContentLists: 'Trending ContentLists',
  buttonTextUnderground: 'Underground Trending DigitalContents'
}

const TRENDING_PAGES = {
  digitalContents: {
    native: { screen: 'trending' as const },
    web: { route: TRENDING_PAGE }
  },
  contentLists: {
    native: {
      screen: 'explore' as const,
      params: { screen: 'TrendingContentLists' as const }
    },
    web: { route: TRENDING_CONTENT_LISTS_PAGE }
  },
  underground: {
    native: {
      screen: 'explore' as const,
      params: { screen: 'TrendingUnderground' as const }
    },
    web: { route: TRENDING_UNDERGROUND_PAGE }
  }
}

const textMap = {
  contentLists: {
    modalTitle: messages.contentListsModalTitle,
    title: messages.contentListTitle,
    button: messages.buttonTextContentLists
  },
  digitalContents: {
    modalTitle: messages.digitalContentsModalTitle,
    title: messages.digitalContentsTitle,
    button: messages.buttonTextDigitalContents
  },
  underground: {
    modalTitle: messages.undergroundModalTitle,
    title: messages.undergroundTitle,
    button: messages.buttonTextUnderground
  }
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  content: {
    height: '100%',
    width: '100%',
    paddingBottom: spacing(8)
  },
  modalTitleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing(8),
    marginTop: spacing(2),
    marginBottom: spacing(4)
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: typography.fontSize.xxl
  },
  chartEmoji: {
    height: 24,
    width: 24,
    marginTop: spacing(1),
    marginRight: spacing(3)
  },
  titles: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: spacing(8),
    marginTop: spacing(8)
  },
  subtitle: {
    fontSize: 13
  },
  trendingControl: {
    marginHorizontal: 28
  },
  lastWeek: {
    textAlign: 'center',
    marginBottom: spacing(4),
    fontSize: spacing(6)
  },
  buttonContainer: {
    marginTop: spacing(4),
    marginHorizontal: spacing(4),
    marginBottom: spacing(2)
  },
  button: { paddingHorizontal: 0 },
  terms: {
    marginBottom: spacing(4),
    textAlign: 'center',
    width: '100%',
    textDecorationLine: 'underline'
  }
}))

// Getters and setters for whether we're looking at
// trending contentLists or trending digitalContents
const useRewardsType = (): [
  TrendingRewardsModalType,
  (type: TrendingRewardsModalType) => void
] => {
  const dispatch = useDispatchWeb()
  const rewardsType = useSelectorWeb(getTrendingRewardsModalType)
  const setTrendingRewardsType = useCallback(
    (type: TrendingRewardsModalType) => {
      dispatch(setTrendingRewardsModalType({ modalType: type }))
    },
    [dispatch]
  )
  return [rewardsType ?? 'digitalContents', setTrendingRewardsType]
}

const useTweetId = (type: TrendingRewardsModalType) => {
  const digitalContentsId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_DIGITAL_CONTENTS)
  const contentListsId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_CONTENT_LISTS)
  const undergroundId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_UNDERGROUND)
  return {
    digitalContents: digitalContentsId,
    contentLists: contentListsId,
    underground: undergroundId
  }[type]
}

const useIsDark = () => {
  const themeVariant = useThemeVariant()
  return themeVariant === Theme.DARK
}

export const TrendingRewardsDrawer = () => {
  const navigation = useNavigation<AppScreenParamList>()
  const { onClose } = useDrawerState(TRENDING_REWARDS_DRAWER_NAME)
  const styles = useStyles()
  const [modalType, setModalType] = useRewardsType()
  const isDark = useIsDark()

  const tweetId = useTweetId(modalType)

  const tabOptions = [
    {
      key: 'digitalContents',
      text: messages.digitalContents
    },
    {
      key: 'contentLists',
      text: messages.contentLists
    },
    {
      key: 'underground',
      text: messages.underground
    }
  ]

  const handleGoToTrending = useCallback(() => {
    const navConfig = TRENDING_PAGES[modalType]
    navigation.navigate(navConfig)
    onClose()
  }, [modalType, navigation, onClose])

  return (
    <AppDrawer
      modalName={TRENDING_REWARDS_DRAWER_NAME}
      isFullscreen
      isGestureSupported={false}
    >
      <View style={styles.content}>
        <View style={styles.modalTitleContainer}>
          <Image
            style={styles.chartEmoji as ImageStyle}
            source={ChartIncreasing}
          />
          <GradientText style={styles.modalTitle}>
            {textMap[modalType].modalTitle}
          </GradientText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.trendingControl}>
            <SegmentedControl
              fullWidth
              options={tabOptions}
              selected={modalType}
              onSelectOption={(option) =>
                setModalType(option as TrendingRewardsModalType)
              }
              key={`rewards-slider-${tabOptions.length}`}
            />
          </View>
          <View style={styles.titles}>
            <Text variant='h3' color='secondary'>
              {textMap[modalType].title}
            </Text>
            <Text style={styles.subtitle} weight='bold' color='neutralLight4'>
              {messages.winners}
            </Text>
          </View>

          <GradientText style={styles.lastWeek}>
            {messages.lastWeek}
          </GradientText>
          <TweetEmbed
            // Refresh it when we toggle
            key={`twitter-${tweetId}`}
            tweetId={tweetId}
            options={{
              theme: isDark ? 'dark' : 'light',
              cards: 'none',
              conversation: 'none',
              hide_thread: true
            }}
          />

          <View style={styles.buttonContainer}>
            <Button
              variant='primary'
              size='large'
              icon={IconArrow}
              iconPosition='right'
              fullWidth
              title={textMap[modalType].button}
              onPress={handleGoToTrending}
              styles={{ button: styles.button }}
            />
          </View>
          <Link url={TOS_URL}>
            <Text style={styles.terms} variant='body2'>
              {messages.terms}
            </Text>
          </Link>
        </ScrollView>
      </View>
    </AppDrawer>
  )
}
