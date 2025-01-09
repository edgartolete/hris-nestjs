import * as log4js from 'log4js';

log4js.configure({
  appenders: {
    infoOut: {
      type: 'stdout',
    },
    justInfo: {
      type: 'logLevelFilter',
      appender: 'infoOut',
      level: 'info',
      maxLevel: 'info',
    },
    debugFile: {
      type: 'file',
      filename: 'debug.log',
    },
    justDebugs: {
      type: 'logLevelFilter',
      appender: 'debugFile',
      level: 'debug',
      maxLevel: 'debug',
    },
    errorFile: {
      type: 'file',
      filename: 'error.log',
    },
    justErrors: {
      type: 'logLevelFilter',
      appender: 'errorFile',
      level: 'error',
      maxLevel: 'fatal',
    },
  },
  categories: {
    default: {
      appenders: ['justInfo', 'justDebugs', 'justErrors'],
      level: 'debug',
    },
  },
});

const logger = log4js.getLogger();

// logger hierarchy: TRACE < DEBUG < INFO < WARN < ERROR < FATAL < OFF
logger.level = 'debug';

export { logger };
