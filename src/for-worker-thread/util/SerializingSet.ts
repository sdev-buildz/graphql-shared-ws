function getSortedJson(obj: Record<string, unknown>): string {
  // Handle objects by sorting keys alphabetically
  const sortedObj: Record<string, unknown> = {}
  const sortedKeys = Object.keys(obj).sort()

  for (const key of sortedKeys) {
    const value = obj[key]
    if (typeof value === 'object' && value !== null) {
      sortedObj[key] = JSON.parse(
        getSortedJson(value as Record<string, unknown>)
      )
    } else {
      sortedObj[key] = value
    }
  }

  return JSON.stringify(sortedObj)
}

/**
 * Stores objects.
 * Compares them based on deep structural equality
 */
export class SerializingSet<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Set {
  constructor(items?: Iterable<T>) {
    super()
    if (items) {
      for (const item of items) {
        this.add(item)
      }
    }
  }

  // Override modification methods
  override add(value: T): this {
    super.add(getSortedJson(value))
    return this
  }

  override delete(value: T): boolean {
    return super.delete(getSortedJson(value))
  }

  override has(value: T): boolean {
    return super.has(getSortedJson(value))
  }

  // Override retrieval & iteration methods (deserializing on the fly)
  override *values(): SetIterator<T> {
    for (const val of super.values()) {
      yield JSON.parse(val) as T
    }
  }

  override forEach(
    callbackfn: (value1: T, value2: T, set: Set<T>) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any
  ): void {
    super.forEach((val) => {
      const parsed = JSON.parse(val)
      callbackfn.call(thisArg, parsed, parsed, this as unknown as Set<T>)
    })
  }

  override [Symbol.iterator](): SetIterator<T> {
    return this.values()
  }
}
