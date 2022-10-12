import { useSelector } from 'react-redux'

import { Genre } from 'common/utils/genres'
import { makeGetCurrent } from 'store/player/selectors'

import ForwardSkipButton, { ForwardSkipButtonProps } from './forwardSkipButton'
import NextButton, { NextButtonProps } from './nextButton'

type NextButtonProviderProps = NextButtonProps | ForwardSkipButtonProps

const NextButtonProvider = (props: NextButtonProviderProps) => {
  const { digital_content } = useSelector(makeGetCurrent())
  const isPodcast = digital_content && digital_content.genre === Genre.PODCASTS
  return isPodcast ? (
    <ForwardSkipButton {...props} />
  ) : (
    <NextButton {...props} />
  )
}

export default NextButtonProvider
