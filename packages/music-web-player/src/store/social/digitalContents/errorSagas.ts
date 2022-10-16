import * as socialDigitalContentActions from 'common/store/social/digital_contents/actions'
import createErrorSagas from 'common/utils/errorSagas'

type DigitalContentRepostErrors =
  | ReturnType<typeof socialDigitalContentActions.digitalContentRepostFailed>
  | ReturnType<typeof socialDigitalContentActions.saveDigitalContentFailed>
  | ReturnType<typeof socialDigitalContentActions.unsaveDigitalContentFailed>

const errorSagas = createErrorSagas<DigitalContentRepostErrors>({
  errorTypes: [
    socialDigitalContentActions.REPOST_FAILED,
    socialDigitalContentActions.UNSAVE_DIGITAL_CONTENT_FAILED,
    socialDigitalContentActions.SAVE_DIGITAL_CONTENT_FAILED
  ],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: DigitalContentRepostErrors) => ({
    error: action.error,
    digitalContentId: action.digitalContentId
  })
})

export default errorSagas
