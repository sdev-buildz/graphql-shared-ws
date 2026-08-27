/**
 * The actual unmocked setTimeout.
 * Can be used to bypass vitest fake timers.
 */
const setRealTimeout = globalThis.setTimeout

/**
 * advance by real time.
 */
export const advanceByRealTime = async (milliseconds: number) =>
  new Promise((resolve, reject) => setRealTimeout(resolve, milliseconds))
