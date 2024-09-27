// src/utils/logger.js

let logListeners = [];

const logLevels = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
  LOG: 'log'
};

export const addLogListener = (listener) => {
  logListeners.push(listener);
};

export const removeLogListener = (listener) => {
  logListeners = logListeners.filter(l => l !== listener);
};

const log = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message: typeof message === 'string' ? message : JSON.stringify(message),
    details: args.length > 0 ? JSON.stringify(args) : undefined
  };

  // Still log to console for development purposes
  console[level.toLowerCase()](message, ...args);

  // Notify all listeners
  logListeners.forEach(listener => listener(logEntry));
};

export const logger = {
  info: (message, ...args) => log(logLevels.INFO, message, ...args),
  warn: (message, ...args) => log(logLevels.WARN, message, ...args),
  error: (message, ...args) => log(logLevels.ERROR, message, ...args),
  debug: (message, ...args) => log(logLevels.DEBUG, message, ...args),
  log: (message, ...args) => log(logLevels.LOG, message, ...args)
};