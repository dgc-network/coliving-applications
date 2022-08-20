import { useCallback } from 'react'

import type { EntityType } from '-client/src/common/store/notifications/types'
import { useDispatch } from 'react-redux'

import { Text } from 'app/components/core'
import { close } from 'app/store/notifications/actions'
import { getCollectionRoute, getAgreementRoute } from 'app/utils/routes'

import { useDrawerNavigation } from '../useDrawerNavigation'

type EntityLinkProps = {
  entity: EntityType
}

export const EntityLink = (props: EntityLinkProps) => {
  const { entity } = props
  const dispatch = useDispatch()
  const navigation = useDrawerNavigation()

  const onPress = useCallback(() => {
    if ('agreement_id' in entity) {
      navigation.navigate({
        native: {
          screen: 'Agreement',
          params: { id: entity.agreement_id, fromNotifications: true }
        },
        web: { route: getAgreementRoute(entity) }
      })
    } else if (entity.user) {
      const { user } = entity

      navigation.navigate({
        native: {
          screen: 'Collection',
          params: { id: entity.contentList_id, fromNotifications: true }
        },
        web: { route: getCollectionRoute({ ...entity, user }) }
      })
    }
    dispatch(close())
  }, [entity, navigation, dispatch])

  return (
    <Text fontSize='large' weight='medium' color='secondary' onPress={onPress}>
      {'title' in entity ? entity.title : entity.contentList_name}
    </Text>
  )
}
