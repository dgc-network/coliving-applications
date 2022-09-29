import { useContext } from 'react'

import { getUserId } from '@coliving/web/src/common/store/account/selectors'
import Config from 'react-native-config'

import Appearance from 'app/assets/images/emojis/waning-crescent-moon.png'
import { SegmentedControl } from 'app/components/core'
import { ThemeContext } from 'app/components/theme/themeContext'
import { useSelectTierInfo } from 'app/hooks/useSelectTierInfo'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { Theme } from 'app/utils/theme'

import { SettingsRowLabel } from './settingRowLabel'
import { SettingsRow } from './settingsRow'
import { SettingsRowContent } from './settingsRowContent'
import { SettingsRowDescription } from './settingsRowDescription'

const isStaging = Config.ENVIRONMENT === 'staging'

const messages = {
  appearance: 'Appearance',
  appearanceDescription:
    "Enable dark mode or choose 'Auto' to change with your system settings",
  auto: 'Auto',
  dark: 'Dark',
  light: 'Light',
  matrix: 'Matrix'
}

export const AppearanceSettingsRow = () => {
  const { theme, setTheme } = useContext(ThemeContext)
  const accountId = useSelectorWeb(getUserId)

  const { tier } = useSelectTierInfo(accountId ?? 0)

  const appearanceOptions = [
    { key: Theme.AUTO, text: messages.auto },
    { key: Theme.DARK, text: messages.dark },
    { key: Theme.DEFAULT, text: messages.light }
  ]

  if (tier === 'gold' || tier === 'platinum' || isStaging) {
    appearanceOptions.push({ key: Theme.MATRIX, text: messages.matrix })
  }

  return (
    <SettingsRow>
      <SettingsRowLabel label={messages.appearance} iconSource={Appearance} />
      <SettingsRowDescription>
        {messages.appearanceDescription}
      </SettingsRowDescription>
      <SettingsRowContent>
        <SegmentedControl
          fullWidth
          options={appearanceOptions}
          defaultSelected={theme}
          onSelectOption={setTheme}
        />
      </SettingsRowContent>
    </SettingsRow>
  )
}
