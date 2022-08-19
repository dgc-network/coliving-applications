import * as socialAgreementActions from 'common/store/social/agreements/actions'
import createErrorSagas from 'common/utils/errorSagas'

type AgreementRepostErrors =
  | ReturnType<typeof socialAgreementActions.agreementRepostFailed>
  | ReturnType<typeof socialAgreementActions.saveAgreementFailed>
  | ReturnType<typeof socialAgreementActions.unsaveAgreementFailed>

const errorSagas = createErrorSagas<AgreementRepostErrors>({
  errorTypes: [
    socialAgreementActions.REPOST_FAILED,
    socialAgreementActions.UNSAVE_AGREEMENT_FAILED,
    socialAgreementActions.SAVE_AGREEMENT_FAILED
  ],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: AgreementRepostErrors) => ({
    error: action.error,
    agreementId: action.agreementId
  })
})

export default errorSagas
