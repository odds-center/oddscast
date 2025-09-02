# Golden Race 서버 통합 Dockerfile
FROM node:20-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY . .

# 빌드 실행
RUN npm run build

# 개발 스테이지
FROM base AS development
ENV NODE_ENV=development

# 헬스체크를 위한 curl 설치
RUN apk add --no-cache curl

# 포트 노출
EXPOSE 3002

# 애플리케이션 실행
CMD ["npm", "run", "start:dev"]

# 프로덕션 스테이지
FROM node:20-alpine AS production

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 빌드된 파일 복사
COPY --from=base /app/dist ./dist

# 사용자 생성 (보안)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 소유권 변경
RUN chown -R nestjs:nodejs /app
USER nestjs

# 헬스체크를 위한 curl 설치
RUN apk add --no-cache curl

# 포트 노출
EXPOSE 3002

# 환경변수 설정
ENV NODE_ENV=production

# 애플리케이션 실행
CMD ["node", "dist/main"] 