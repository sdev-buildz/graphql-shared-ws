/**
 * Used to enforce uniqueness among subscriber ids.
 */
const facadeIdSet = new Set<string>()

/**
 * Generates a new unique id to uniquely identify a subscriber.
 */
export const generateFacadeId = () => {
  do {
    const id = 'facade-ws-id-' + crypto.randomUUID()
    if (facadeIdSet.has(id)) continue
    facadeIdSet.add(id)
    return id
    // eslint-disable-next-line no-constant-condition
  } while (true)
}
