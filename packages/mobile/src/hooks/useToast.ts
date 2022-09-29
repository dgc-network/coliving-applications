import { useContext } from 'react'

import { ToastContext } from 'app/components/toast/toastContext'

export const useToast = () => useContext(ToastContext)
