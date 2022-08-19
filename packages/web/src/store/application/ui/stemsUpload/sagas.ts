import { Name, Agreement, User } from '@coliving/common'
import { takeEvery, put, call, select } from 'redux-saga/effects'

import { getAgreement } from 'common/store/cache/agreements/selectors'
import { retrieveAgreements } from 'common/store/cache/agreements/utils'
import { getUser } from 'common/store/cache/users/selectors'
import {
  startStemUploads,
  stemUploadsSucceeded
} from 'common/store/stems-upload/slice'
import { handleUploads } from 'pages/upload-page/store/sagas'
import { createStemMetadata } from 'pages/upload-page/store/utils/stems'
import { make } from 'store/analytics/actions'

function* watchUploadStems() {
  yield takeEvery(
    startStemUploads.type,
    function* (action: ReturnType<typeof startStemUploads>) {
      const { uploads, parentId, batchUID } = action.payload
      const stemAgreements = uploads.map((u) => {
        const metadata = createStemMetadata({
          parentAgreementId: parentId,
          agreement: u.metadata,
          stemCategory: u.category
        })
        return {
          metadata,
          agreement: {
            ...u,
            metadata
          }
        }
      })
      const { agreementIds } = yield call(handleUploads, {
        agreements: stemAgreements,
        isCollection: false,
        isStem: true
      })

      yield put(stemUploadsSucceeded({ parentId, batchUID }))

      if (agreementIds) {
        for (let i = 0; i < agreementIds.length; i += 1) {
          const agreementId = agreementIds[i]
          const category = stemAgreements[i].metadata.stem_of.category
          const recordEvent = make(Name.STEM_COMPLETE_UPLOAD, {
            id: agreementId,
            parent_agreement_id: parentId,
            category
          })
          yield put(recordEvent)
        }
      }

      // Retrieve the parent agreement to refresh stems
      const agreement: Agreement = yield select(getAgreement, { id: parentId })
      const ownerUser: User = yield select(getUser, { id: agreement.owner_id })
      yield call(retrieveAgreements, {
        agreementIds: [
          { id: parentId, handle: ownerUser.handle, url_title: agreement.title }
        ],
        withStems: true,
        canBeUnlisted: true
      })
    }
  )
}

const sagas = () => {
  return [watchUploadStems]
}

export default sagas
