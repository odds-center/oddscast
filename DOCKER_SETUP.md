# 🐳 Docker 환경 설정 가이드

## 📋 개요

Golden Race 프로젝트의 Docker 환경 설정 및 실행 가이드입니다.

---

## 🚀 1단계: Docker 설치 및 실행

### 1.1 Docker Desktop 설치

```bash
# macOS
brew install --cask docker

# 또는 공식 사이트에서 다운로드
# https://www.docker.com/products/docker-desktop
```

### 1.2 Docker 실행 확인

```bash
docker --version
docker-compose --version
docker ps
```

---

## 🗄️ 2단계: MySQL 컨테이너 설정

### 2.1 MySQL 전용 Docker Compose 실행

```bash
cd server
docker-compose -f docker-compose.mysql.yml up -d
```

### 2.2 MySQL 연결 확인

```bash
# 컨테이너 상태 확인
docker ps

# MySQL 로그 확인
docker logs goldenrace-mysql-dev

# MySQL 접속 테스트
docker exec -it goldenrace-mysql-dev mysql -u root -p
```

### 2.3 phpMyAdmin 접속

```
URL: http://localhost:8080
서버: mysql
사용자명: goldenrace_user
비밀번호: goldenrace_password
데이터베이스: goldenrace
```

---

## 🏗️ 3단계: 개발 환경 실행

### 3.1 개발 환경 Docker Compose 실행

```bash
cd server
docker-compose -f docker-compose.dev.yml up -d
```

### 3.2 서비스 상태 확인

```bash
# 모든 서비스 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 로그 확인
docker-compose -f docker-compose.dev.yml logs app
docker-compose -f docker-compose.dev.yml logs mysql
```

### 3.3 개발 환경 접속

```
NestJS 서버: http://localhost:3002
MySQL: localhost:3306
phpMyAdmin: http://localhost:8080
```

---

## 🚀 4단계: 프로덕션 환경 실행

### 4.1 프로덕션 환경 빌드

```bash
cd server
docker-compose -f docker-compose.prod.yml build
```

### 4.2 프로덕션 환경 실행

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4.3 프로덕션 환경 접속

```
NestJS 서버: http://localhost:3002
MySQL: localhost:3306
Nginx: http://localhost:80
```

---

## 🔧 5단계: Docker 명령어 모음

### 5.1 컨테이너 관리

```bash
# 컨테이너 시작
docker-compose -f docker-compose.dev.yml up -d

# 컨테이너 중지
docker-compose -f docker-compose.dev.yml down

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart

# 컨테이너 상태 확인
docker-compose -f docker-compose.dev.yml ps
```

### 5.2 로그 확인

```bash
# 모든 서비스 로그
docker-compose -f docker-compose.dev.yml logs

# 특정 서비스 로그
docker-compose -f docker-compose.dev.yml logs app
docker-compose -f docker-compose.dev.yml logs mysql

# 실시간 로그
docker-compose -f docker-compose.dev.yml logs -f app
```

### 5.3 데이터베이스 관리

```bash
# MySQL 컨테이너 접속
docker exec -it goldenrace-mysql-dev mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE goldenrace_dev;
CREATE DATABASE goldenrace_prod;

# 사용자 생성 및 권한 부여
CREATE USER 'goldenrace_user'@'%' IDENTIFIED BY 'goldenrace_password';
GRANT ALL PRIVILEGES ON goldenrace_dev.* TO 'goldenrace_user'@'%';
GRANT ALL PRIVILEGES ON goldenrace_prod.* TO 'goldenrace_user'@'%';
FLUSH PRIVILEGES;
```

---

## 🧹 6단계: 정리 및 재설정

### 6.1 모든 컨테이너 정리

```bash
# 모든 컨테이너 중지 및 삭제
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.mysql.yml down -v

# 모든 Docker 리소스 정리
docker system prune -a --volumes
```

### 6.2 MySQL 포트 충돌 해결

```bash
# 로컬 MySQL 서비스 중지
sudo brew services stop mysql
sudo pkill -f mysqld

# Docker MySQL 재시작
docker-compose -f docker-compose.mysql.yml up -d
```

### 6.3 데이터베이스 초기화

```bash
# MySQL 컨테이너 접속
docker exec -it goldenrace-mysql-dev mysql -u root -p

# 데이터베이스 삭제 및 재생성
DROP DATABASE IF EXISTS goldenrace_dev;
CREATE DATABASE goldenrace_dev;

# 초기 스키마 실행
USE goldenrace_dev;
SOURCE /docker-entrypoint-initdb.d/01_create_database.sql;
```

---

## 📊 7단계: 모니터링 및 디버깅

### 7.1 리소스 사용량 확인

```bash
# 컨테이너 리소스 사용량
docker stats

# 디스크 사용량
docker system df

# 네트워크 상태
docker network ls
docker network inspect goldenrace-dev-network
```

### 7.2 로그 분석

```bash
# 에러 로그만 확인
docker-compose -f docker-compose.dev.yml logs app | grep ERROR

# 특정 시간대 로그
docker-compose -f docker-compose.dev.yml logs --since="2025-08-20T10:00:00" app

# 로그 파일로 저장
docker-compose -f docker-compose.dev.yml logs app > app.log
```

---

## ⚠️ 주의사항

### 1. **포트 충돌**

- MySQL 포트 3306 충돌 주의
- 로컬 MySQL 서비스와 Docker MySQL 동시 실행 금지

### 2. **데이터 영속성**

- `docker-compose down -v` 실행 시 볼륨 삭제됨
- 중요한 데이터는 백업 필요

### 3. **환경변수**

- `.env` 파일이 Docker 컨테이너에 마운트되어야 함
- 환경별 설정 파일 분리 권장

### 4. **리소스 제한**

- 개발 환경: 적은 리소스 할당
- 프로덕션 환경: 충분한 리소스 할당

---

## 🔍 문제 해결

### 1. **"Ports are not available" 오류**

```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :3306

# 프로세스 종료
sudo pkill -f mysqld
sudo brew services stop mysql
```

### 2. **"Cannot connect to the Docker daemon" 오류**

```bash
# Docker Desktop 실행
open -a Docker

# Docker 서비스 상태 확인
docker info
```

### 3. **"Connection refused" 오류**

```bash
# 컨테이너 상태 확인
docker ps

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart mysql
```

---

## 📚 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [MySQL Docker 이미지](https://hub.docker.com/_/mysql)
- [Nginx Docker 이미지](https://hub.docker.com/_/nginx)

---

## ✅ Docker 환경 설정 체크리스트

- [ ] Docker Desktop 설치 및 실행
- [ ] MySQL 컨테이너 실행
- [ ] phpMyAdmin 접속 확인
- [ ] 개발 환경 Docker Compose 실행
- [ ] NestJS 서버 접속 확인
- [ ] 데이터베이스 연결 확인
- [ ] 프로덕션 환경 빌드 및 실행
- [ ] Nginx 리버스 프록시 확인
- [ ] 로그 모니터링 설정
- [ ] 문제 해결 가이드 숙지

**모든 항목이 체크되면 Docker 환경 설정이 완료됩니다! 🎉**
