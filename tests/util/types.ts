/**
 * The field can be mutated by adding a string suffix.
 */
export type MutableFieldType = `suffix_is_${string}`

/**
 * The number of times the field has been mutated
 */
export type MutationCountType = `mutated_${number}_times`

/**
 * The last value published by the iterator
 */
export type SubscribableFieldType = `iterating_${number}`
