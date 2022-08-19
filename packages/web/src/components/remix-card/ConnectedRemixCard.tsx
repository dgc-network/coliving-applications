import { useCallback } from 'react'

import { ID, SquareSizes } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getAgreement } from 'common/store/cache/agreements/selectors'
import { getUserFromAgreement } from 'common/store/cache/users/selectors'
import RemixCard from 'components/remix-card/RemixCard'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

type OwnProps = {
  agreementId: ID
}

type ConnectedRemixCardProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard(
  ({ agreement, user, ...p }: ConnectedRemixCardProps) =>
    agreement && user && { ...p, agreement, user }
)

const ConnectedRemixCard = g(({ agreement, user, goToRoute }) => {
  const profilePictureImage = useUserProfilePicture(
    user.user_id,
    user._profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150
  )
  const coverArtImage = useAgreementCoverArt(
    agreement.agreement_id,
    agreement._cover_art_sizes,
    SquareSizes.SIZE_480_BY_480
  )
  const goToAgreementPage = useCallback(() => {
    goToRoute(agreement.permalink)
  }, [goToRoute, agreement])
  const goToArtistPage = useCallback(() => {
    goToRoute(profilePage(user.handle))
  }, [goToRoute, user])

  return (
    <RemixCard
      profilePictureImage={profilePictureImage}
      coverArtImage={coverArtImage}
      coSign={agreement._co_sign}
      artistName={user.name}
      artistHandle={user.handle}
      onClick={goToAgreementPage}
      onClickArtistName={goToArtistPage}
      userId={user.user_id}
    />
  )
})

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    agreement: getAgreement(state, { id: ownProps.agreementId }),
    user: getUserFromAgreement(state, { id: ownProps.agreementId })
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedRemixCard)
