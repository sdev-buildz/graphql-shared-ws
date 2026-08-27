import { format, transports } from 'winston'
import { consoleFormat } from 'winston-console-format'
import { formatColorize, includeSourceLocation } from './formats'

/**
 * Formats the logs with colors and indentations and
 *  outputs to the console.
 */
export const consoleTransport = new transports.Console({
  handleExceptions: true,
  format: format.combine(
    formatColorize,
    format.padLevels(),
    includeSourceLocation(),
    consoleFormat({
      showMeta: true,
      metaStrip: ['timestamp', 'service'],
      inspectOptions: {
        depth: Infinity,
        colors: true,
        maxArrayLength: Infinity,
        breakLength: 100,
        compact: Infinity,
      },
    })
  ),
})
