/**
 * Runs the development server with hot module reload.
 * @packageDocumentation
 */
import { logger } from '@packages/logger'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { getWebpackConfig } from './webpack.config'
const config = getWebpackConfig()

const compiler = webpack(config)

if (!compiler) {
  logger.error('Ensure if you are passing any callback to the webpack function')
  process.exit(1)
}

if (!config.devServer) {
  logger.error(
    'Ensure the devServer field is not undefined in the webpack configuration object.'
  )
  process.exit(1)
}

const server = new WebpackDevServer(config.devServer, compiler)

const runServer = async () => {
  logger.info('Starting the frontend dev server...', Date.now(), new Date())
  await server.start()
  logger.info('Started the frontend dev server...', Date.now(), new Date())
}

runServer().catch((error) => {
  logger.error('Failed to start the frontend dev server:', error)
  logger.error('Failed to start the frontend dev server:')

  process.exit(1)
})

/**
 * Gracefully shuts down the frontend dev server.
 */
async function gracefullyShutdown() {
  logger.info('\nGracefully shutting down the frontend dev server...')
  await server.stop()
  process.exit(0)
}

process.on('SIGINT', gracefullyShutdown)

process.on('SIGTERM', gracefullyShutdown)
