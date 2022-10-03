import { useSelector } from 'react-redux'

import { Genre } from 'common/utils/genres'
import { makeGetCurrent } from 'store/player/selectors'

import ForwardSkipButton, { ForwardSkipButtonProps } from './forwardSkipButton'
import NextButton, { NextButtonProps } from './nextButton'

type NextButtonProviderProps = NextButtonProps | ForwardSkipButtonProps

const NextButtonProvider = (props: NextButtonProviderProps) => {
  const { agreement } = useSelector(makeGetCurrent())
  const isPodcast = agreement && agreement.genre === Genre.PODCASTS
  return isPodcast ? (
    <ForwardSkipButton {...props} />
  ) : (
    <NextButton {...props} />
  )
}

export default NextButtonProvider