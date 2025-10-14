# 🚀 개발 환경 설정 가이드

## 빠른 시작

### 1. 개발 환경 설정

```bash
npm run dev
```

### 2. 개발 서버 시작

```bash
# 일반 시작 (캐시 클리어)
npm start

# 빠른 시작 (캐시 리셋)
npm run start:fast

# 라이브 리로드 모드 (파일 변경 시 자동 새로고침)
npm run start:live
```

## 🔧 사용 가능한 스크립트

| 명령어                | 설명                               |
| --------------------- | ---------------------------------- |
| `npm start`           | 기본 개발 서버 시작 (캐시 클리어)  |
| `npm run start:fast`  | 빠른 시작 (캐시 리셋)              |
| `npm run start:live`  | 라이브 리로드 모드 (자동 새로고침) |
| `npm run start:dev`   | 개발 클라이언트 모드               |
| `npm run clear-cache` | 캐시만 클리어                      |
| `npm run clean`       | 전체 정리 및 재시작                |
| `npm run dev`         | 개발 환경 자동 설정                |

## 📱 안드로이드에서 새로고침

### 자동 새로고침 활성화

1. 안드로이드 기기를 흔들거나 `Ctrl + M` (에뮬레이터)
2. 개발자 메뉴에서 "Enable Fast Refresh" 활성화
3. "Reload" 선택

### 수동 새로고침

- 개발자 메뉴 → "Reload"
- 또는 `R` 키 두 번 누르기

## 🛠️ 문제 해결

### UI 변경사항이 반영되지 않을 때

```bash
# 1. 캐시 클리어
npm run clear-cache

# 2. 완전 재시작
npm run clean

# 3. 안드로이드에서 앱 재시작
```

### Metro 번들러 오류

```bash
# Metro 캐시 완전 삭제
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 재시작
npm run start:fast
```

### 의존성 문제

```bash
# node_modules 재설치
rm -rf node_modules
npm install

# Expo 도구 업데이트
npx expo install --fix
```

## ⚡ 최적화 팁

1. **Fast Refresh 활성화**: 항상 켜두세요
2. **개발자 메뉴**: 자주 사용하세요
3. **캐시 관리**: 문제 발생 시 즉시 클리어
4. **파일 감시**: `start:live` 모드 사용

## 🔍 디버깅

### 로그 확인

```bash
# Metro 번들러 로그
npx expo start --clear

# 안드로이드 로그
adb logcat | grep -i expo
```

### 성능 모니터링

- React DevTools 사용
- Flipper 연결 (선택사항)
- Expo DevTools 활용

## 📋 체크리스트

- [ ] Fast Refresh 활성화
- [ ] 개발자 메뉴 접근 가능
- [ ] Metro 번들러 정상 작동
- [ ] 캐시 클리어 명령어 준비
- [ ] 안드로이드 기기 연결 확인
