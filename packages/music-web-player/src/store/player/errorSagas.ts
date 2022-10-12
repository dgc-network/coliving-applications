import createErrorSagas from 'common/utils/errorSagas'
import { error } from 'store/player/slice'

type PlayerErrors = ReturnType<typeof error>

const errorSagas = createErrorSagas<PlayerErrors>({
  errorTypes: [error.type],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: any) => ({
    error: action.error,
    digitalContentId: action.digitalContentId,
    info: action.info
  })
})

export default errorSagas
