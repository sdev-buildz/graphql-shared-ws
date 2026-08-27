import { createPubSub } from 'graphql-yoga'

/**
 * The events that can be published or subscribed to
 */
export type PubsubEventsType = {
  testSub1: []
  testSub2: [number]
  testSubscription: [number]
  stringEmitter: [string]
  subscribeForError: [string]
  subscribeForError2: [string]
  testSub3: [number, { name: string }]
  user: [number | string, { name: string }]
  post: [number | string, { description: string }]
}

/**
 * The PubSub instance
 */
export const pubsub = createPubSub<PubsubEventsType>({})
