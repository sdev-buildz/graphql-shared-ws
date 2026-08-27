/**
 * The host configurations such as host name and port number.
 *
 * This file is accessible by the client side code.
 * So, this file should not be used for secrets.
 */

import path from 'path'

const port = Number(
  process.env.PORT ?? (process.env.RUNNER_OS === 'Linux' ? 3080 : 443)
)

const sharedConfig = {
  /** Whether this server is hosted with HTTPS protocol or not */
  https: Boolean(process.env.HTTPS ?? true),

  /** The port of this server's endpoint */
  port,

  /**
   * The host uri, on which this server is hosted.
   * This is same as this website's origin.
   */
  origin: process.env.ORIGIN ?? `https://localhost:${port}`,

  /** The endpoint of the GraphQL API */
  graphqlEndpoint: '',
  graphqlWssEndpoint: '',

  graphqlSdlPath: './shared/schema.graphql',

  webClientPort: Number(process.env.WEB_CLIENT_PORT ?? 443),

  /**
   * The origin of the frontend server.
   *  It is mostly the same as the origin of this server.
   */
  webClientOrigin:
    process.env.WEB_CLIENT_ORIGIN ??
    process.env.ORIGIN ??
    'https://localhost:443',

  /** The port of this server's endpoint */
  environment: (process.env.IS_PRODUCTION === 'true' ? 'PROD' : 'DEV') as
    'PROD' | 'DEV',

  /**
   * To enable console logging in production.
   * It is enabled by default during development.
   */
  enableWinstonConsoleTransport:
    process.env.ENABLE_WINSTON_CONSOLE_TRANSPORT === 'true',

  /**
   * The path to the folder in which the frontend bundle is emitted by webpack
   */
  webClientBundlePath:
    path?.resolve?.(import.meta.dirname, '../dist') ?? 'dist',
}

sharedConfig.graphqlEndpoint = sharedConfig.origin + '/api/graphql'
sharedConfig.graphqlWssEndpoint = `wss://${sharedConfig.origin.substring(sharedConfig.origin.indexOf('://') + 3)}/api/graphql`

export default sharedConfig
