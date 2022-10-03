import { createUseLocalStorageHook } from 'common/hooks/useLocalStorage'
import { getJSONValue, setJSONValue } from 'services/localStorage'

export const useLocalStorage = createUseLocalStorageHook({
  getLocalStorageItem: getJSONValue,
  setLocalStorageItem: setJSONValue
})
