# 🐳 Docker 환경 설정 가이드

## 📋 개요

Golden Race 프로젝트의 Docker 환경 설정 및 실행 가이드입니다.

---

## 🚀 Docker 설치

### macOS

```bash
# Homebrew로 설치
brew install --cask docker

# 또는 공식 사이트에서 다운로드
# https://www.docker.com/products/docker-desktop
```

### Windows

1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop) 다운로드
2. 설치 프로그램 실행
3. WSL 2 백엔드 활성화

### Linux

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get install docker-compose-plugin
```

### 설치 확인

```bash
docker --version
docker-compose --version
docker ps
```

---

## 🗄️ MySQL 컨테이너 설정

### MySQL 전용 실행

```bash
cd server
docker-compose -f docker-compose.mysql.yml up -d
```

### 연결 정보

```
Host: localhost
Port: 3306
Username: goldenrace_user
Password: goldenrace_password
Database: goldenrace
```

### MySQL 접속 테스트

```bash
# 컨테이너 상태 확인
docker ps

# MySQL 로그 확인
docker logs goldenrace-mysql-dev

# MySQL CLI 접속
docker exec -it goldenrace-mysql-dev mysql -u goldenrace_user -p
```

### phpMyAdmin 접속

```
URL: http://localhost:8080
Server: mysql
Username: goldenrace_user
Password: goldenrace_password
```

---

## 🏗️ 개발 환경 실행

### 개발 환경 Docker Compose

```bash
cd server
docker-compose -f docker-compose.dev.yml up -d
```

### 서비스 구성

| 서비스     | 포트 | 설명               |
| ---------- | ---- | ------------------ |
| app        | 3002 | NestJS 서버        |
| mysql      | 3306 | MySQL 데이터베이스 |
| phpmyadmin | 8080 | 데이터베이스 관리  |

### 서비스 상태 확인

```bash
# 모든 서비스 상태
docker-compose -f docker-compose.dev.yml ps

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f mysql
```

---

## 🚀 프로덕션 환경 실행

### 프로덕션 빌드

```bash
cd server
docker-compose -f docker-compose.prod.yml build
```

### 프로덕션 실행

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 서비스 구성

| 서비스 | 포트    | 설명                   |
| ------ | ------- | ---------------------- |
| app    | 3002    | NestJS 서버 (프로덕션) |
| mysql  | 3306    | MySQL 데이터베이스     |
| nginx  | 80, 443 | 리버스 프록시          |

---

## 🔧 Docker 명령어

### 컨테이너 관리

```bash
# 시작
docker-compose -f docker-compose.dev.yml up -d

# 중지
docker-compose -f docker-compose.dev.yml down

# 재시작
docker-compose -f docker-compose.dev.yml restart

# 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 특정 서비스만 재시작
docker-compose -f docker-compose.dev.yml restart app
```

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose -f docker-compose.dev.yml logs

# 특정 서비스 로그
docker-compose -f docker-compose.dev.yml logs app

# 실시간 로그 (tail -f)
docker-compose -f docker-compose.dev.yml logs -f app

# 최근 N개 로그
docker-compose -f docker-compose.dev.yml logs --tail=100 app
```

### 데이터베이스 관리

```bash
# MySQL 컨테이너 접속
docker exec -it goldenrace-mysql-dev bash

# MySQL CLI 직접 접속
docker exec -it goldenrace-mysql-dev mysql -u root -p

# 데이터베이스 백업
docker exec goldenrace-mysql-dev mysqldump -u root -p goldenrace > backup.sql

# 데이터베이스 복원
docker exec -i goldenrace-mysql-dev mysql -u root -p goldenrace < backup.sql
```

---

## 🧹 정리 및 재설정

### 컨테이너 정리

```bash
# 모든 컨테이너 중지 및 삭제
docker-compose -f docker-compose.dev.yml down

# 볼륨까지 삭제
docker-compose -f docker-compose.dev.yml down -v

# 이미지까지 삭제
docker-compose -f docker-compose.dev.yml down --rmi all -v
```

### 전체 Docker 리소스 정리

```bash
# 사용하지 않는 모든 리소스 정리
docker system prune -a --volumes

# 개별 정리
docker container prune  # 중지된 컨테이너
docker image prune      # 사용하지 않는 이미지
docker volume prune     # 사용하지 않는 볼륨
docker network prune    # 사용하지 않는 네트워크
```

### 포트 충돌 해결

```bash
# 로컬 MySQL 서비스 중지
sudo brew services stop mysql  # macOS
sudo systemctl stop mysql      # Linux

# 프로세스 강제 종료
sudo pkill -f mysqld

# Docker MySQL 재시작
docker-compose -f docker-compose.mysql.yml up -d
```

---

## 📊 모니터링

### 리소스 사용량

```bash
# 컨테이너 리소스 사용량 (CPU, 메모리)
docker stats

# 디스크 사용량
docker system df

# 상세 디스크 사용량
docker system df -v
```

### 네트워크 확인

```bash
# 네트워크 목록
docker network ls

# 네트워크 상세 정보
docker network inspect goldenrace-dev-network
```

### 로그 분석

```bash
# 에러 로그만 필터링
docker-compose -f docker-compose.dev.yml logs app | grep ERROR

# 특정 시간대 로그
docker-compose -f docker-compose.dev.yml logs --since="2025-10-10T10:00:00" app

# 로그를 파일로 저장
docker-compose -f docker-compose.dev.yml logs app > app.log
```

---

## ⚠️ 주의사항

### 1. 포트 충돌

- MySQL 포트 3306 충돌 주의
- 로컬 MySQL 서비스와 Docker MySQL 동시 실행 금지
- `docker-compose.yml`에서 포트 변경 가능

### 2. 데이터 영속성

- `docker-compose down -v` 실행 시 볼륨 삭제됨
- 중요한 데이터는 반드시 백업
- 볼륨 마운트 경로 확인

### 3. 환경변수

- `.env` 파일이 Docker 컨테이너에 마운트되어야 함
- 환경별 설정 파일 분리 권장
- 민감한 정보는 `.gitignore`에 추가

### 4. 리소스 제한

- 개발 환경: 적은 리소스 할당
- 프로덕션 환경: 충분한 리소스 할당
- Docker Desktop 설정에서 리소스 조정

---

## 🔍 문제 해결

### "Ports are not available" 오류

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3306  # macOS/Linux
netstat -ano | findstr :3306  # Windows

# 프로세스 종료
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### "Cannot connect to the Docker daemon" 오류

```bash
# Docker Desktop 실행 (macOS)
open -a Docker

# Docker 서비스 시작 (Linux)
sudo systemctl start docker

# Docker 서비스 상태 확인
docker info
```

### "Connection refused" 오류

```bash
# 컨테이너 상태 확인
docker ps

# 컨테이너 로그 확인
docker logs goldenrace-mysql-dev

# 컨테이너 재시작
docker restart goldenrace-mysql-dev
```

### 빌드 실패

```bash
# 캐시 없이 다시 빌드
docker-compose -f docker-compose.dev.yml build --no-cache

# 이미지 삭제 후 재빌드
docker-compose -f docker-compose.dev.yml down --rmi all
docker-compose -f docker-compose.dev.yml build
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
- [ ] MySQL 컨테이너 실행 확인
- [ ] phpMyAdmin 접속 확인
- [ ] 개발 환경 실행 확인
- [ ] NestJS 서버 접속 확인
- [ ] 데이터베이스 연결 확인
- [ ] 로그 모니터링 설정
- [ ] 백업 스크립트 작성

---

**마지막 업데이트**: 2025년 10월 10일
