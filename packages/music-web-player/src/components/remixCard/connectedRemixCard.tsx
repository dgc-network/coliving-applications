import { useCallback } from 'react'

import { ID, SquareSizes } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUserFromDigitalContent } from 'common/store/cache/users/selectors'
import RemixCard from 'components/remixCard/remixCard'
import { useDigitalContentCoverArt } from 'hooks/useDigitalContentCoverArt'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

type OwnProps = {
  digitalContentId: ID
}

type ConnectedRemixCardProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard(
  ({ digital_content, user, ...p }: ConnectedRemixCardProps) =>
    digital_content && user && { ...p, digital_content, user }
)

const ConnectedRemixCard = g(({ digital_content, user, goToRoute }) => {
  const profilePictureImage = useUserProfilePicture(
    user.user_id,
    user._profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150
  )
  const coverArtImage = useDigitalContentCoverArt(
    digital_content.digital_content_id,
    digital_content._cover_art_sizes,
    SquareSizes.SIZE_480_BY_480
  )
  const goToDigitalContentPage = useCallback(() => {
    goToRoute(digital_content.permalink)
  }, [goToRoute, digital_content])
  const goToLandlordPage = useCallback(() => {
    goToRoute(profilePage(user.handle))
  }, [goToRoute, user])

  return (
    <RemixCard
      profilePictureImage={profilePictureImage}
      coverArtImage={coverArtImage}
      coSign={digital_content._co_sign}
      landlordName={user.name}
      landlordHandle={user.handle}
      onClick={goToDigitalContentPage}
      onClickLandlordName={goToLandlordPage}
      userId={user.user_id}
    />
  )
})

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    digital_content: getDigitalContent(state, { id: ownProps.digitalContentId }),
    user: getUserFromDigitalContent(state, { id: ownProps.digitalContentId })
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedRemixCard)
