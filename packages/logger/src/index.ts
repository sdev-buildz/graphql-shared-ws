import { createLogger, format } from 'winston'
import { consoleTransport } from './lib'

/**
 * The Winston logger instance.
 */
export const logger = createLogger({
  level: 'silly',
  format: format.combine(
    format.timestamp(),
    format.ms(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    /**
     * Logs for development.
     * Formatted and printed into the terminal.
     */
    process.env.NODE_ENV !== 'PROD' && consoleTransport,
  ].filter((transport) => transport !== false),
})
