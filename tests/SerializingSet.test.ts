import { expect, it } from 'vitest'
import { SerializingSet } from '../src/for-worker-thread/util/SerializingSet'

it('compares objects based on deep structural equality', () => {
  const obj1 = { a: 1, b: 2 }
  const obj2 = { c: 2, d: 1 }
  const set = new SerializingSet([obj1, obj2])

  expect(set.has(obj1)).toEqual(true)
  expect(set.has(obj2)).toEqual(true)
  expect(set.has({ a: 1, b: 3 })).toBe(false)
})

it('ignores order of object keys.', () => {
  const obj1 = { a: 1, b: 2 }
  const obj2 = { c: 2, d: 1 }
  const set = new SerializingSet([obj1, obj2])

  expect(set.has({ b: 2, a: 1 })).toBe(true)
})

it('deletes.', () => {
  const obj1 = { a: 1, b: 2 }
  const obj2 = { c: 2, d: 1 }
  const set = new SerializingSet([obj1, obj2])

  set.delete(obj1)
  expect(set.has(obj1)).toBe(false)
})

it('values returns iterator of values.', () => {
  const obj1 = { a: 1, b: 2 }
  const obj2 = { c: 2, d: 1 }
  const set = new SerializingSet([obj1, obj2])

  expect(Array.from(set.values())).toStrictEqual([obj1, obj2])
})

it('forEach iterates over values.', () => {
  const obj1 = { a: 1, b: 2 }
  const obj2 = { c: 2, d: 1 }
  const set = new SerializingSet([obj1, obj2])

  const values: unknown[] = []
  set.forEach((val) => values.push(val))
  expect(values).toStrictEqual([obj1, obj2])
})
