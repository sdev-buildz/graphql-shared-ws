import './for-testing'
import { builder } from './lib/builder'

/**
 * The Pothos GraphQL Schema
 */
export const schema = builder.toSchema()
