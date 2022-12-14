import { Name } from '@coliving/common'
import { range } from 'lodash'
import { all, put, select } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import { make } from 'store/analytics/actions'

export function* reportSuccessAndFailureEvents({
  numSuccess,
  numFailure,
  uploadType,
  errors
}: {
  numSuccess: number
  numFailure: number
  uploadType: 'single_digital_content' | 'multi_digital_content' | 'album' | 'contentList'
  errors: string[]
}) {
  const accountUser: ReturnType<typeof getAccountUser> = yield select(
    getAccountUser
  )
  if (!accountUser) return
  const primary = accountUser.content_node_endpoint?.split(',')[0]
  if (!primary) return
  const successEvents = range(numSuccess).map((_) =>
    make(Name.DIGITAL_CONTENT_UPLOAD_SUCCESS, {
      endpoint: primary,
      kind: uploadType
    })
  )

  const failureEvents = range(numFailure).map((i) =>
    make(Name.DIGITAL_CONTENT_UPLOAD_FAILURE, {
      endpoint: primary,
      kind: uploadType,
      error: errors[i]
    })
  )

  yield all([...successEvents, ...failureEvents].map((e) => put(e)))
}
