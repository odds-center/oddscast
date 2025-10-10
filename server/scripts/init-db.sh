#!/bin/bash

# Golden Race 데이터베이스 초기화 스크립트
# 이 스크립트는 MySQL 데이터베이스를 초기화하고 모든 테이블을 생성합니다.

set -e

echo "🚀 Golden Race 데이터베이스 초기화를 시작합니다..."

# 환경 변수 설정
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-goldenrace_user}
DB_PASSWORD=${DB_PASSWORD:-goldenrace_password}
DB_NAME=${DB_NAME:-goldenrace}

# MySQL 컨테이너가 실행 중인지 확인
if ! docker ps | grep -q "goldenrace-mysql"; then
    echo "❌ MySQL 컨테이너가 실행 중이 아닙니다."
    echo "다음 명령어로 MySQL을 시작해주세요:"
    echo "  npm run docker:mysql"
    exit 1
fi

echo "📊 MySQL 컨테이너 상태 확인 완료"

# MySQL이 완전히 시작될 때까지 기다리기
echo "⏳ MySQL 서비스가 준비될 때까지 기다리는 중..."
until docker exec goldenrace-mysql mysqladmin ping -h localhost -u root -prootpassword --silent; do
    echo "MySQL 서비스 준비 중... (5초 후 재시도)"
    sleep 5
done
echo "✅ MySQL 서비스가 준비되었습니다!"

# 데이터베이스 초기화 (1단계만으로 충분)
echo "📝 데이터베이스 완전 초기화..."
docker exec -i goldenrace-mysql mysql -u root -p'rootpassword' < mysql/init/01_create_database.sql

echo "✅ 데이터베이스 초기화가 완료되었습니다!"

# 테이블 목록 확인
echo "📋 생성된 테이블 목록:"
docker exec -i goldenrace-mysql mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES;"

echo ""
echo "🎉 Golden Race 데이터베이스가 성공적으로 초기화되었습니다!"
echo "이제 서버를 시작할 수 있습니다: npm run dev:local" 