import winston from 'winston';
import { CURRENT_CONFIG } from '../constants/environment';

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 로그 레벨에 따른 색상 정의
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 색상 추가
winston.addColors(colors);

// 로그 포맷 정의
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => `${info['timestamp']} ${info.level}: ${info.message}`
  )
);

// 로그 레벨 설정 (환경별 설정 사용)
const level = () => {
  return CURRENT_CONFIG.logLevel;
};

// 로거 생성
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports: [
    // 콘솔 출력
    new winston.transports.Console(),

    // 파일 출력 (에러 로그)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),

    // 파일 출력 (모든 로그)
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// 개발 환경에서는 더 자세한 로그 출력
if (CURRENT_CONFIG.logLevel === 'debug') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export { logger };
