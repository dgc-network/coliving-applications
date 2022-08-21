import { User } from '@coliving/common'
import { CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY } from '@coliving/sdk/dist/core'

// TODO: the following should come from @coliving/libs/dist/core when
// discoveryNode/constants is migrated to typescript.
const DISCOVERY_NODE_TIMESTAMP = '@coliving/libs:discovery-node-timestamp'

const COLIVING_ACCOUNT_KEY = '@coliving/account'
const COLIVING_ACCOUNT_USER_KEY = '@coliving/coliving-user'

const getValue = (key: string) => {
  if (window && window.localStorage) {
    const val = window.localStorage.getItem(key)
    return val ?? null
  }
  return null
}

export const getJSONValue = (key: string) => {
  const val = getValue(key)
  if (val) {
    try {
      const parsed = JSON.parse(val)
      return parsed
    } catch (e) {
      return null
    }
  }
  return null
}

const setValue = (key: string, value: string) => {
  if (window && window.localStorage) {
    window.localStorage.setItem(key, value)
  }
}

export const setJSONValue = (key: string, value: any) => {
  const string = JSON.stringify(value)
  setValue(key, string)
}

const removeItem = (key: string) => {
  if (window && window.localStorage) {
    window.localStorage.removeItem(key)
  }
}

export const getColivingAccount = () => getJSONValue(COLIVING_ACCOUNT_KEY)
export const setColivingAccount = (value: object) =>
  setJSONValue(COLIVING_ACCOUNT_KEY, value)
export const clearColivingAccount = () => removeItem(COLIVING_ACCOUNT_KEY)

export const getColivingAccountUser = () => getJSONValue(COLIVING_ACCOUNT_USER_KEY)
export const setColivingAccountUser = (value: User) =>
  setJSONValue(COLIVING_ACCOUNT_USER_KEY, value)
export const clearColivingAccountUser = () => removeItem(COLIVING_ACCOUNT_USER_KEY)

export const getCurrentUserExists = () =>
  getValue(CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY)

export const getCachedDiscoveryNode = () =>
  getJSONValue(DISCOVERY_NODE_TIMESTAMP)
