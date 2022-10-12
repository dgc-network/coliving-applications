import { useSelector } from 'react-redux'

import { Genre } from 'common/utils/genres'
import { makeGetCurrent } from 'store/player/selectors'

import BackwardSkipButton, {
  BackwardSkipButtonProps
} from './backwardSkipButton'
import PreviousButton, { PreviousButtonProps } from './previousButton'

type PreviousButtonProviderProps = PreviousButtonProps | BackwardSkipButtonProps

const PreviousButtonProvider = (props: PreviousButtonProviderProps) => {
  const { digital_content } = useSelector(makeGetCurrent())
  const isPodcast = digital_content && digital_content.genre === Genre.PODCASTS
  return isPodcast ? (
    <BackwardSkipButton {...props} />
  ) : (
    <PreviousButton {...props} />
  )
}

export default PreviousButtonProvider
