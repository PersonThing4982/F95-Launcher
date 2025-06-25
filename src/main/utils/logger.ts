import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs-extra';

const logDir = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.f95launcher',
  'logs',
);

fs.ensureDirSync(logDir);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, label }) => {
    const logLabel = label ? `[${label}] ` : '';
    if (stack) {
      return `${timestamp} ${logLabel}${level}: ${message}\n${stack}`;
    }
    return `${timestamp} ${logLabel}${level}: ${message}`;
  }),
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}

export function createLogger(label: string) {
  return {
    info: (message: string, ...args: any[]) => logger.info({ message, label, ...args }),
    warn: (message: string, ...args: any[]) => logger.warn({ message, label, ...args }),
    error: (message: string, ...args: any[]) => logger.error({ message, label, ...args }),
    debug: (message: string, ...args: any[]) => logger.debug({ message, label, ...args }),
  };
}

export default logger;
