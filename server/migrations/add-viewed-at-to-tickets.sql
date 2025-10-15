-- 예측권에 viewedAt 컬럼 추가 (예측 업데이트 감지용)
-- 생성일: 2025-10-15

ALTER TABLE prediction_tickets
ADD COLUMN viewed_at DATETIME NULL COMMENT '예측을 본 시점'
AFTER prediction_id;

-- 기존 사용된 티켓에 대해 viewedAt = usedAt로 초기화
UPDATE prediction_tickets
SET viewed_at = used_at
WHERE status = 'USED' AND used_at IS NOT NULL;

