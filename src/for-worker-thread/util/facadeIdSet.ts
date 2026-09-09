/**
 * Used to enforce uniqueness among facade ids.
 */
const facadeIdSet = new Set<string>()

/**
 * Generates a new unique id to uniquely identify a facade.
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
