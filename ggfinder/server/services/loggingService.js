/**
 * Logging service for centralized error reporting and monitoring
 */
const pino = require('pino');

// Configure logger based on environment
const loggerOptions = process.env.NODE_ENV === 'production' 
  ? { 
      level: 'info',
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
    } 
  : { 
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    };

const logger = pino(loggerOptions);

/**
 * Log an information message
 * @param {string} message - Message to log
 * @param {Object} data - Additional data to include in log
 */
const info = (message, data = {}) => {
  logger.info(data, message);
};

/**
 * Log a warning message
 * @param {string} message - Message to log
 * @param {Object} data - Additional data to include in log
 */
const warn = (message, data = {}) => {
  logger.warn(data, message);
};

/**
 * Log an error message
 * @param {string} message - Message to log
 * @param {Error|Object} error - Error object or data
 * @param {Object} context - Additional context information
 */
const error = (message, error = {}, context = {}) => {
  const logData = {
    ...context,
    ...(error instanceof Error ? {
      errorMessage: error.message,
      stack: error.stack,
      name: error.name
    } : error)
  };
  
  logger.error(logData, message);
};

/**
 * Log a debug message
 * @param {string} message - Message to log
 * @param {Object} data - Additional data to include in log
 */
const debug = (message, data = {}) => {
  logger.debug(data, message);
};

/**
 * Create a child logger with additional context
 * @param {Object} bindings - Additional properties to attach to logs
 * @returns {Object} Child logger instance
 */
const child = (bindings = {}) => {
  return logger.child(bindings);
};

module.exports = {
  info,
  warn,
  error,
  debug,
  child
};