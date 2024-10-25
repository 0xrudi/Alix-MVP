// src/utils/logger.js

// Initialize log history at the module level
let logListeners = [];
let logHistory = [];

const logLevels = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
  LOG: 'log'
};

export const addLogListener = (listener) => {
  logListeners.push(listener);
  // Send existing logs to new listener
  logHistory.forEach(entry => listener(entry));
};

export const removeLogListener = (listener) => {
  logListeners = logListeners.filter(l => l !== listener);
};

const formatLogDetails = (args) => {
  try {
    if (args.length === 0) return undefined;
    return args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');
  } catch (error) {
    console.error('Error formatting log details:', error);
    return String(args);
  }
};

const log = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
    details: formatLogDetails(args)
  };

  // Add to history
  logHistory.push(logEntry);
  
  // Keep only last 1000 logs
  if (logHistory.length > 1000) {
    logHistory = logHistory.slice(-1000);
  }

  // Still log to console for development purposes
  console[level.toLowerCase()](message, ...args);

  // Notify all listeners
  logListeners.forEach(listener => listener(logEntry));
};

export const downloadLogs = () => {
  try {
    if (logHistory.length === 0) {
      console.error('No logs to download');
      return;
    }

    const data = JSON.stringify(logHistory, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alix-debug-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading logs:', error);
  }
};

export const clearLogs = () => {
  logHistory = [];
  logListeners.forEach(listener => listener({ type: 'clear' }));
};

export const getLogHistory = () => {
  return [...logHistory];
};

export const logger = {
  info: (message, ...args) => log(logLevels.INFO, message, ...args),
  warn: (message, ...args) => log(logLevels.WARN, message, ...args),
  error: (message, ...args) => log(logLevels.ERROR, message, ...args),
  debug: (message, ...args) => log(logLevels.DEBUG, message, ...args),
  log: (message, ...args) => log(logLevels.LOG, message, ...args),
  getLogHistory,
  clearLogs
};