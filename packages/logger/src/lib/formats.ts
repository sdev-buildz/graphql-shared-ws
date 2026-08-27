import winston, { format, type createLogger } from 'winston'

/**
 * The return value of {@link format.colorize} after applying the custom configurations.
 */
export const formatColorize = format.colorize({
  all: true,
  colors:
    /**
     * Applying 'italic' to logs which are not development only logs.
     * Development only logs include 'debug', 'warn' or 'error' levels.
     */
    Object.fromEntries(
      ['help', 'data', 'info', 'prompt', 'verbose', 'input', 'silly'].map(
        (level) => [level, winston.config.cli.colors[level] + ` italic`]
      )
    ),
})

/**
 * To print the file path, line number and position at which the log was made.
 */
export const includeSourceLocation = format((info, options) => {
  if (
    !info.level.includes('debug') &&
    !info.level.includes('warn') &&
    !info.level.includes('error')
  )
    return info

  info = {
    $sourceLocation: getSourceLocation(),
    ...info,
  }
  return info
})

/**
 * @returns file path, line number and position at which the currently processed log was made.
 */
const getSourceLocation = (): string | undefined => {
  Error.stackTraceLimit = Infinity
  const error = new Error()
  if (typeof error.stack !== 'string') {
    return
  }

  /**
   * In the error stack, the direct parent entry of the entry for the {@link createLogger} function call is the source of the log.
   */
  const sourceLocationLinePos: number =
    error.stack.indexOf('\n', error.stack.indexOf('create-logger.js:')) + 1
  const sourceLocation: string = error.stack.slice(
    sourceLocationLinePos,
    error.stack?.indexOf('\n', sourceLocationLinePos + 1)
  )
  return sourceLocation
}
