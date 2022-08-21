import { User } from '@coliving/common'

import { FollowLandlordsCategory } from 'pages/sign-on/store/types'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class SignInFailureMessage extends NativeMobileMessage {
  constructor({ error }: { error: any }) {
    super(MessageType.SIGN_IN_FAILURE, { error })
  }
}

export class SignUpValidateEmailFailureMessage extends NativeMobileMessage {
  constructor({ error }: { error: any }) {
    super(MessageType.SIGN_UP_VALIDATE_EMAIL_FAILURE, { error })
  }
}

export class SignUpValidateEmailSuccessMessage extends NativeMobileMessage {
  constructor({ available }: { available: any }) {
    super(MessageType.SIGN_UP_VALIDATE_EMAIL_SUCCESS, { available })
  }
}

export class SignUpValidateHandleFailureMessage extends NativeMobileMessage {
  constructor({ error }: { error: any }) {
    super(MessageType.SIGN_UP_VALIDATE_HANDLE_FAILURE, { error })
  }
}

export class SignUpValidateHandleSuccessMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.SIGN_UP_VALIDATE_HANDLE_SUCCESS)
  }
}

export class FetchAllFollowLandlordsSuccessMessage extends NativeMobileMessage {
  constructor({
    category,
    userIds
  }: {
    category: FollowLandlordsCategory
    userIds: number[]
  }) {
    super(MessageType.FETCH_ALL_FOLLOW_LANDLORDS_SUCCEEDED, { category, userIds })
  }
}

export class FetchAllFollowLandlordsFailureMessage extends NativeMobileMessage {
  constructor({ error }: { error: any }) {
    super(MessageType.FETCH_ALL_FOLLOW_LANDLORDS_FAILED, { error })
  }
}

export class SetUsersMessage extends NativeMobileMessage {
  constructor({ users }: { users: User[] }) {
    super(MessageType.SET_USERS_TO_FOLLOW, { users })
  }
}

export class SetAccountAvailableMessage extends NativeMobileMessage {
  constructor({ email, handle }: { email: string; handle: string }) {
    super(MessageType.SET_ACCOUNT_AVAILABLE, { email, handle })
  }
}

export class SignUpSuccessMessage extends NativeMobileMessage {
  constructor({ userId }: { userId: number | null }) {
    super(MessageType.SIGN_UP_SUCCESS, { userId })
  }
}
