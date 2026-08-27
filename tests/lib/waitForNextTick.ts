/**
 * To await for next tick.
 * @returns Promise which resolves after next tick
 */
export const waitForNextTick = () =>
  new Promise((resolve) => process.nextTick(resolve))
