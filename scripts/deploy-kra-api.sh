#!/bin/bash

# 한국마사회 API 연동 배포 스크립트
# 사용법: ./scripts/deploy-kra-api.sh

set -e

echo "🚀 한국마사회 API 연동 배포를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Supabase CLI 확인
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI가 설치되지 않았습니다."
    echo "설치 방법: https://supabase.com/docs/guides/cli"
    exit 1
fi

log_info "Supabase CLI 확인 완료"

# 2. 프로젝트 링크 확인
if [ ! -f "supabase/.temp/project_id" ]; then
    log_warn "프로젝트가 링크되지 않았습니다."
    echo "프로젝트 ID를 입력하세요:"
    read -r PROJECT_ID
    supabase link --project-ref "$PROJECT_ID"
else
    log_info "프로젝트 링크 확인 완료"
fi

# 3. 환경변수 설정
log_info "환경변수 설정 중..."

# 한국마사회 API 키 확인
if [ -z "$KRA_API_KEY" ]; then
    log_warn "KRA_API_KEY 환경변수가 설정되지 않았습니다."
    echo "한국마사회 API 키를 입력하세요 (Encoding된 키):"
    read -r KRA_API_KEY
fi

# 환경변수 설정
supabase secrets set KRA_API_KEY="$KRA_API_KEY"

log_info "환경변수 설정 완료"

# 4. 데이터베이스 마이그레이션 적용
log_info "데이터베이스 마이그레이션 적용 중..."
supabase db push

log_info "데이터베이스 마이그레이션 완료"

# 5. Edge Function 배포
log_info "Edge Function 배포 중..."
supabase functions deploy fetch-race-data

log_info "Edge Function 배포 완료"

# 6. 테스트 실행
log_info "API 테스트 실행 중..."

# Edge Function URL 가져오기
PROJECT_ID=$(cat supabase/.temp/project_id 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    log_warn "프로젝트 ID를 찾을 수 없습니다. 수동으로 테스트해주세요."
else
    # 테스트 실행
    RESPONSE=$(curl -s -X POST "https://$PROJECT_ID.supabase.co/functions/v1/fetch-race-data" \
        -H "Authorization: Bearer $(supabase status --output json | jq -r '.api.anon_key')" \
        -H "Content-Type: application/json" || echo "{}")
    
    if echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
        log_info "API 테스트 성공!"
        echo "응답: $RESPONSE"
    else
        log_warn "API 테스트 실패 또는 응답 형식이 예상과 다릅니다."
        echo "응답: $RESPONSE"
    fi
fi

# 7. Cron Job 설정 안내
log_info "배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Supabase 대시보드에서 Cron Job이 활성화되었는지 확인"
echo "2. 매일 오전 6시에 자동으로 데이터가 가져와집니다"
echo "3. 수동 실행: supabase db function call manual_fetch_race_data"
echo ""
echo "🔗 유용한 링크:"
echo "- Supabase 대시보드: https://supabase.com/dashboard/project/$PROJECT_ID"
echo "- Edge Functions: https://supabase.com/dashboard/project/$PROJECT_ID/functions"
echo "- Database: https://supabase.com/dashboard/project/$PROJECT_ID/editor"

log_info "배포 스크립트 완료!" 