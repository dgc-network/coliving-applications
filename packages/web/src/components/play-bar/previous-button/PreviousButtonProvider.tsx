import { useSelector } from 'react-redux'

import { Genre } from 'common/utils/genres'
import { makeGetCurrent } from 'store/player/selectors'

import BackwardSkipButton, {
  BackwardSkipButtonProps
} from './BackwardSkipButton'
import PreviousButton, { PreviousButtonProps } from './PreviousButton'

type PreviousButtonProviderProps = PreviousButtonProps | BackwardSkipButtonProps

const PreviousButtonProvider = (props: PreviousButtonProviderProps) => {
  const { agreement } = useSelector(makeGetCurrent())
  const isPodcast = agreement && agreement.genre === Genre.PODCASTS
  return isPodcast ? (
    <BackwardSkipButton {...props} />
  ) : (
    <PreviousButton {...props} />
  )
}

export default PreviousButtonProvider
