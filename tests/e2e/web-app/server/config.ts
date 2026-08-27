/**
 * {@inheritDoc config}
 * @see config
 */

import { logger } from '@packages/logger'
import sharedConfig from '@shared/config'

/**
 * The server's configuration object.
 * It abstracts the environment variables.
 */
const config = {
  sampleEnv: process.env.SAMPLE_ENV,
  ...sharedConfig,

  /**
   * Whether to print the schema.graphql file whenever the schema module gets executed.
   */
  printGraphqlSdl:
    process.env.PRINT_GRAPHQL_SDL === 'true' ||
    /**
     * It is 'true' by default during development, in order to print on every hot reload.
     * The printed file will be read by the codegen.
     */
    sharedConfig.environment === 'DEV',

  auth: {
    /**
     * Used in authorization header. The key must be 32 bytes (256 bits) for AES-256
     */
    jweKey:
      process.env.JWE_KEY ??
      (sharedConfig.environment === 'DEV' ? '1'.repeat(32) : ''),
  },
}

if (!config.auth.jweKey) {
  logger.error(
    `No JWE Key present. Provide a JWE_KEY environment variable and keep it secure from others.`,
    {
      readMoreAboutJwe: `https://datatracker.ietf.org/doc/html/rfc7516`,
    }
  )
  process.emit('SIGTERM')
}

config.auth.jweKey = config.auth.jweKey as string

export default config
