//import React from 'react'
import * as React from 'react'

import type { DigitalContent } from '@coliving/common'
import { SquareSizes } from '@coliving/common'
import { getDominantColorsByDigitalContent } from '@coliving/web/src/common/store/average-color/slice'
import { Dimensions, StyleSheet, View } from 'react-native'
import { Shadow } from 'react-native-shadow-2'

import { DynamicImage } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { useDigitalContentCoverArt } from 'app/hooks/useDigitalContentCoverArt'
import type { ThemeColors } from 'app/utils/theme'

const dimensions = Dimensions.get('window')
const spacing = 24

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      marginLeft: spacing,
      marginRight: spacing,
      maxHeight: dimensions.width - spacing * 2,
      alignSelf: 'center'
    },
    shadow: {
      alignSelf: 'flex-start'
    },
    image: {
      alignSelf: 'center',
      borderRadius: 8,
      borderColor: themeColors.white,
      borderWidth: 2,
      overflow: 'hidden',
      height: '100%',
      width: '100%',
      aspectRatio: 1
    }
  })

type ArtworkProps = {
  digital_content: DigitalContent
}

export const Artwork = ({ digital_content }: ArtworkProps) => {
  const styles = useThemedStyles(createStyles)
  const image = useDigitalContentCoverArt({
    id: digital_content.digital_content_id,
    sizes: digital_content._cover_art_sizes,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const dominantColors = useSelectorWeb((state) =>
    getDominantColorsByDigitalContent(state, {
      digital_content
    })
  )

  let shadowColor = 'rgba(0,0,0,0)'
  const dominantColor = dominantColors ? dominantColors[0] : null
  if (dominantColor) {
    const { r, g, b } = dominantColor
    shadowColor = `rgba(${r.toFixed()},${g.toFixed()},${b.toFixed()},0.1)`
  }

  return (
    <View style={styles.root}>
      <Shadow
        viewStyle={styles.shadow}
        offset={[0, 1]}
        radius={15}
        distance={10}
        startColor={shadowColor}
      >
        <View style={styles.image}>
          <DynamicImage uri={image} />
        </View>
      </Shadow>
    </View>
  )
}
