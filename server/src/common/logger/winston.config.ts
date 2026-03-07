import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, context, stack }) => {
    const ctx = context ? ` [${context}]` : '';
    return stack
      ? `${timestamp} ${level}${ctx} ${message}\n${stack}`
      : `${timestamp} ${level}${ctx} ${message}`;
  }),
);

export const winstonConfig: winston.LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    // Console output (dev-friendly format)
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Error-only log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // All levels log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 10,
    }),
  ],
};

export const appLogger = winston.createLogger(winstonConfig);
