import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

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

// File transports are only used in development (Railway captures stdout in production)
const fileTransports: winston.transport[] = [];
if (!isProduction) {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );
  fileTransports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 20 * 1024 * 1024,
      maxFiles: 10,
    }),
  );
}

export const winstonConfig: winston.LoggerOptions = {
  level: isProduction ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    ...fileTransports,
  ],
};

export const appLogger = winston.createLogger(winstonConfig);
