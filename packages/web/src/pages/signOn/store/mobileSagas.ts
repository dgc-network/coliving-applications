import { User } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { all, call, put, select, take, takeEvery } from 'redux-saga/effects'

import * as accountActions from 'common/store/account/reducer'
import {
  SignInFailureMessage,
  SignUpValidateEmailFailureMessage,
  SignUpValidateEmailSuccessMessage,
  SignUpValidateHandleFailureMessage,
  SignUpValidateHandleSuccessMessage,
  SignUpSuccessMessage,
  FetchAllFollowLandlordsSuccessMessage,
  SetUsersMessage,
  SetAccountAvailableMessage,
  FetchAllFollowLandlordsFailureMessage
} from 'services/native-mobile-interface/signon'
import { MessageType } from 'services/native-mobile-interface/types'
import { dataURLtoFile } from 'utils/fileUtils'
import { resizeImage } from 'utils/imageProcessingUtil'
import { FEED_PAGE } from 'utils/route'

import * as signOnActions from './actions'
import { getSignOn } from './selectors'
import { FollowLandlordsCategory } from './types'

const GENERAL_ADMISSION = process.env.REACT_APP_GENERAL_ADMISSION

function* watchSignIn() {
  yield takeEvery(
    [MessageType.SUBMIT_SIGNIN],
    function* (action: { type: string; email: string; password: string }) {
      yield put(signOnActions.setValueField('email', action.email))
      yield put(signOnActions.setValueField('password', action.password))
      yield put(signOnActions.signIn(action.email, action.password))
    }
  )
}

function* watchSignInFailed() {
  yield takeEvery(
    [signOnActions.SIGN_IN_FAILED],
    function (action: { type: string; error: string }) {
      const message = new SignInFailureMessage({
        error: action.error
      })
      message.send()
    }
  )
}

function* watchSignupValidateAndCheckEmail() {
  yield takeEvery(
    [MessageType.SIGN_UP_VALIDATE_AND_CHECK_EMAIL],
    function* (action: { type: string; email: string }) {
      yield put(signOnActions.checkEmail(action.email))
    }
  )
}

function* watchSignupValidateEmailFailed() {
  yield takeEvery(
    [signOnActions.VALIDATE_EMAIL_FAILED],
    function (action: { type: string; error: string }) {
      const message = new SignUpValidateEmailFailureMessage({
        error: action.error
      })
      message.send()
    }
  )
}

function* watchSignupValidateEmailSuccess() {
  yield takeEvery(
    [signOnActions.VALIDATE_EMAIL_SUCCEEDED],
    function (action: { type: string; available: boolean }) {
      const message = new SignUpValidateEmailSuccessMessage({
        available: action.available
      })
      message.send()
    }
  )
}

function* watchSignupValidateHandle() {
  yield takeEvery(
    [MessageType.SIGN_UP_VALIDATE_HANDLE],
    function* (action: {
      type: string
      handle: string
      verified: boolean
      onValidate?: (error: boolean) => void
    }) {
      yield put(
        signOnActions.validateHandle(
          action.handle,
          action.verified,
          action.onValidate
        )
      )
    }
  )
}

function* watchSignupValidateHandleFailed() {
  yield takeEvery(
    [signOnActions.VALIDATE_HANDLE_FAILED],
    function (action: { type: string; error: string }) {
      const message = new SignUpValidateHandleFailureMessage({
        error: action.error
      })
      message.send()
    }
  )
}

function* watchSignupValidateHandleSuccess() {
  yield takeEvery(
    [signOnActions.VALIDATE_HANDLE_SUCCEEDED],
    function (action: { type: string }) {
      const message = new SignUpValidateHandleSuccessMessage()
      message.send()
    }
  )
}

function* watchFetchAllFollowLandlords() {
  yield takeEvery(
    [MessageType.FETCH_ALL_FOLLOW_LANDLORDS],
    function* (action: { type: string }) {
      yield put(signOnActions.fetchAllFollowLandlords())
    }
  )
}

function* watchFetchFollowLandlordsSucceeded() {
  yield takeEvery(
    [signOnActions.FETCH_FOLLOW_LANDLORDS_SUCCEEDED],
    function* (action: {
      type: string
      category: FollowLandlordsCategory
      userIds: number[]
    }) {
      const { category, userIds } = action
      const message = new FetchAllFollowLandlordsSuccessMessage({
        category,
        userIds
      })
      message.send()
    }
  )
}

function* watchFetchFollowLandlordsFailed() {
  yield takeEvery(
    [signOnActions.FETCH_FOLLOW_LANDLORDS_FAILED],
    function* (action: { type: string; error: any }) {
      const message = new FetchAllFollowLandlordsFailureMessage({
        error: action.error
      })
      message.send()
    }
  )
}

function* watchGetUsersToFollow() {
  yield takeEvery(
    [MessageType.GET_USERS_TO_FOLLOW],
    function* (action: { type: string }) {
      yield put(signOnActions.getUsersToFollow())
    }
  )
}

function* watchSetUsersToFollow() {
  yield takeEvery(
    [signOnActions.SET_USERS_TO_FOLLOW],
    function* (action: { type: string; users: User[] }) {
      const { users } = action
      const message = new SetUsersMessage({
        users
      })
      message.send()
    }
  )
}

function* watchAccountAvailable(): any {
  while (
    yield all([
      take(signOnActions.SIGN_UP_SUCCEEDED),
      take(accountActions.fetchAccountSucceeded.type),
      take(signOnActions.FOLLOW_LANDLORDS)
    ])
  ) {
    yield put(pushRoute(FEED_PAGE, { noAnimation: true }))
    const signOn = yield select(getSignOn)
    const message = new SetAccountAvailableMessage({
      email: signOn.email.value,
      handle: signOn.handle.value
    })
    message.send()
  }
}

function* watchSetFollowLandlords() {
  yield takeEvery(
    [MessageType.SET_FOLLOW_LANDLORDS],
    function* (action: {
      type: string
      followLandlords: {
        selectedCategory: FollowLandlordsCategory
        categories: { [key in FollowLandlordsCategory]?: number[] }
        selectedUserIds: number[]
      }
    }) {
      yield put(signOnActions.setField('followLandlords', action.followLandlords))
      yield put(
        signOnActions.followLandlords(action.followLandlords.selectedUserIds)
      )
    }
  )
}

const handleImage = async (
  url: string,
  fileType: string,
  ...resizeArgs: (number | boolean)[]
) => {
  const imageBlob = await fetch(url).then((r) => r.blob())
  const artworkFile = new File([imageBlob], 'Artwork', {
    type: `image/${fileType}`
  })
  return resizeImage(...[artworkFile, ...resizeArgs])
}

function* watchSignUp() {
  yield takeEvery(
    [MessageType.SUBMIT_SIGNUP],
    function* (action: {
      type: string
      email: string
      password: string
      name: string
      handle: string
      profilePictureUrl: string | null
      coverPhotoUrl: string | null
      verified: boolean
      accountAlreadyExisted: boolean
      referrer: number | null
      twitterId: string
      twitterScreenName: string
      instagramId: string
      instagramScreenName: string
    }): any {
      const { profilePictureUrl, coverPhotoUrl } = action
      let profileImage = null
      let coverPhoto = null
      if (profilePictureUrl) {
        if (profilePictureUrl.includes('base64')) {
          // user uploaded image via phone library
          profileImage = {
            file: dataURLtoFile(profilePictureUrl)
          }
        } else {
          // if instagram, go through GA to simplify url and proxy the image fetch
          // otherwise, simply use given url
          const url = profilePictureUrl.includes('instagram')
            ? `${GENERAL_ADMISSION}/proxy/simple?url=${encodeURIComponent(
                profilePictureUrl
              )}`
            : profilePictureUrl
          profileImage = {
            url,
            file: yield call(handleImage, url, 'jpeg')
          }
        }
        yield put(signOnActions.setField('profileImage', profileImage))
      } else {
        yield put(signOnActions.setField('profileImage', null))
      }

      if (coverPhotoUrl) {
        // only possible with twitter oauth
        coverPhoto = {
          url: coverPhotoUrl,
          file: yield call(
            handleImage,
            coverPhotoUrl,
            'jpeg',
            /* maxWidth */ 2000,
            /* square= */ false
          )
        }
        yield put(signOnActions.setField('coverPhoto', coverPhoto))
      } else {
        yield put(signOnActions.setField('coverPhoto', null))
      }

      yield put(signOnActions.setField('twitterId', action.twitterId || ''))
      yield put(
        signOnActions.setField(
          'twitterScreenName',
          action.twitterScreenName || ''
        )
      )
      yield put(signOnActions.setField('instagramId', action.instagramId || ''))
      yield put(
        signOnActions.setField(
          'instagramScreenName',
          action.instagramScreenName || ''
        )
      )
      yield put(signOnActions.setValueField('email', action.email))
      yield put(signOnActions.validateEmailSucceeded())
      yield put(signOnActions.setValueField('password', action.password))
      yield put(signOnActions.setValueField('name', action.name))
      yield put(signOnActions.setValueField('handle', action.handle))
      yield put(signOnActions.validateHandleSucceeded())
      yield put(signOnActions.setField('verified', action.verified))
      yield put(
        signOnActions.setField(
          'accountAlreadyExisted',
          action.accountAlreadyExisted
        )
      )
      yield put(signOnActions.setField('referrer', action.referrer))
      yield put(signOnActions.signUp())
    }
  )
}

function* watchSignupSuccess() {
  yield takeEvery(
    [signOnActions.SIGN_UP_SUCCEEDED_WITH_ID],
    function (action: { type: string; userId: number | null }) {
      const message = new SignUpSuccessMessage({
        userId: action.userId
      })
      message.send()
    }
  )
}

const sagas = () => {
  return [
    watchSignIn,
    watchSignInFailed,
    watchSignupValidateAndCheckEmail,
    watchSignupValidateEmailFailed,
    watchSignupValidateEmailSuccess,
    watchSignupValidateHandle,
    watchSignupValidateHandleFailed,
    watchSignupValidateHandleSuccess,
    watchFetchAllFollowLandlords,
    watchFetchFollowLandlordsSucceeded,
    watchFetchFollowLandlordsFailed,
    watchGetUsersToFollow,
    watchSetUsersToFollow,
    watchSetFollowLandlords,
    watchAccountAvailable,
    watchSignUp,
    watchSignupSuccess
  ]
}
export default sagas
