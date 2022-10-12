import { Name, DigitalContent, User } from '@coliving/common'
import { takeEvery, put, call, select } from 'redux-saga/effects'

import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { retrieveDigitalContents } from 'common/store/cache/digital_contents/utils'
import { getUser } from 'common/store/cache/users/selectors'
import {
  startStemUploads,
  stemUploadsSucceeded
} from 'common/store/stemsUpload/slice'
import { handleUploads } from 'pages/uploadPage/store/sagas'
import { createStemMetadata } from 'pages/uploadPage/store/utils/stems'
import { make } from 'store/analytics/actions'

function* watchUploadStems() {
  yield takeEvery(
    startStemUploads.type,
    function* (action: ReturnType<typeof startStemUploads>) {
      const { uploads, parentId, batchUID } = action.payload
      const stemDigitalContents = uploads.map((u) => {
        const metadata = createStemMetadata({
          parentDigitalContentId: parentId,
          digital_content: u.metadata,
          stemCategory: u.category
        })
        return {
          metadata,
          digital_content: {
            ...u,
            metadata
          }
        }
      })
      const { digitalContentIds } = yield call(handleUploads, {
        digitalContents: stemDigitalContents,
        isCollection: false,
        isStem: true
      })

      yield put(stemUploadsSucceeded({ parentId, batchUID }))

      if (digitalContentIds) {
        for (let i = 0; i < digitalContentIds.length; i += 1) {
          const digitalContentId = digitalContentIds[i]
          const category = stemDigitalContents[i].metadata.stem_of.category
          const recordEvent = make(Name.STEM_COMPLETE_UPLOAD, {
            id: digitalContentId,
            parent_digital_content_id: parentId,
            category
          })
          yield put(recordEvent)
        }
      }

      // Retrieve the parent digital_content to refresh stems
      const digital_content: DigitalContent = yield select(getDigitalContent, { id: parentId })
      const ownerUser: User = yield select(getUser, { id: digital_content.owner_id })
      yield call(retrieveDigitalContents, {
        digitalContentIds: [
          { id: parentId, handle: ownerUser.handle, url_title: digital_content.title }
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
