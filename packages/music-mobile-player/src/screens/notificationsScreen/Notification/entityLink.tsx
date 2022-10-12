import { useCallback } from 'react'

import type { EntityType } from '@coliving/web/src/common/store/notifications/types'
import { useDispatch } from 'react-redux'

import { Text } from 'app/components/core'
import { close } from 'app/store/notifications/actions'
import { getCollectionRoute, getDigitalContentRoute } from 'app/utils/routes'

import { useDrawerNavigation } from '../useDrawerNavigation'

type EntityLinkProps = {
  entity: EntityType
}

export const EntityLink = (props: EntityLinkProps) => {
  const { entity } = props
  const dispatch = useDispatch()
  const navigation = useDrawerNavigation()

  const onPress = useCallback(() => {
    if ('digital_content_id' in entity) {
      navigation.navigate({
        native: {
          screen: 'DigitalContent',
          params: { id: entity.digital_content_id, fromNotifications: true }
        },
        web: { route: getDigitalContentRoute(entity) }
      })
    } else if (entity.user) {
      const { user } = entity

      navigation.navigate({
        native: {
          screen: 'Collection',
          params: { id: entity.content_list_id, fromNotifications: true }
        },
        web: { route: getCollectionRoute({ ...entity, user }) }
      })
    }
    dispatch(close())
  }, [entity, navigation, dispatch])

  return (
    <Text fontSize='large' weight='medium' color='secondary' onPress={onPress}>
      {'title' in entity ? entity.title : entity.content_list_name}
    </Text>
  )
}
