import {
  isShrWsMessage,
  shrWsMessageTypeGuard,
  type SharedWsMessages,
} from '@shared/types'
import type { handleMessageEvent } from '../handler'
import { generateFacadeId } from '../util/facadeIdSet'
import { createFacade, type FacadeSocket } from '../util/types'
/**
 * Gets the {@link FacadeSocket | subscriber handle}.
 * If the event.data is of type {@link SharedWsMessages}.toWorker.getFacadeId, creates a new subscriber id.
 */
export const getFacade = (
  prop: Parameters<typeof handleMessageEvent>[0]
): FacadeSocket | undefined => {
  if (!isShrWsMessage(prop.event.data)) return

  let facade: FacadeSocket | undefined = undefined

  if (
    'facadeId' in prop.event.data &&
    typeof prop.event.data.facadeId === 'string' &&
    'port' in prop
  ) {
    facade = createFacade({
      id: prop.event.data.facadeId,
      messagePort: prop.port,
    })
  }

  if (facade) return facade
  /** Generate a new facade id and send it to the facade client. */
  if (
    !shrWsMessageTypeGuard<SharedWsMessages['toWorker']['getFacadeId']>(
      prop.event.data,
      'shr-ws-get-facade-id'
    )
  )
    return

  facade = createFacade({
    id: generateFacadeId(),
    messagePort: prop.port,
  })

  facade.postMessage({
    messageType: 'shr-ws-facade-id',
    id: facade.id,
  } satisfies SharedWsMessages['fromWorker']['facadeId'])
  return
}
