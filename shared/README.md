# @oddscast/shared

webapp, mobile, admin, server에서 공통으로 사용하는 타입 정의 패키지입니다.

## 설치

각 프로젝트의 `package.json`에 추가:

```json
{
  "dependencies": {
    "@oddscast/shared": "file:../shared"
  }
}
```

그 후 `npm install` 또는 `pnpm install` 실행.

## 사용

```ts
// 필요한 타입만 import
import type {
  ApiResponse,
  AuthResponse,
  Favorite,
  User,
  Race,
  PointTransaction,
  PredictionTicket,
} from '@oddscast/shared';

// 전체 export
import * as SharedTypes from '@oddscast/shared';
```

## 포함 타입

| 카테고리 | 타입 |
|---------|------|
| API | ApiResponse, PaginatedResponse, ApiError, ErrorCode |
| Auth | AuthTokens, AuthResponse, LoginRequest, RegisterRequest, ... |
| User | User, UserProfile, UserStats, ... |
| Race | Race, EntryDetail, RaceResult, RaceListResponse, ... |
| Result | RaceResultItem, ResultListResponse |
| Bet | Bet, CreateBetRequest, BetStats, ... |
| Favorite | Favorite, CreateFavoriteRequest, FavoriteListResponse |
| Point | PointTransactionType, PointStatus, UserPointBalance, PointTransaction |
| Prediction | PredictionResult, PredictionPreview, PredictionStatusResponse, ... |
| PredictionTicket | PredictionTicket, TicketBalance, TicketHistoryResponse |
| Subscription | SubscriptionPlan, Subscription, TicketBalance, SinglePurchase |
| Notification | NotificationPreferenceFlags, NotificationPreferenceKey |

## 프로젝트별 적용

- **webapp**: `lib/types/api.ts`에서 ApiResponse 등 재export
- **admin**: 공통 타입은 `@oddscast/shared`에서 직접 import
- **mobile**: WebView 브릿지 등에서 필요 시 import
- **server**: DTO는 class-validator용으로 별도 유지, 응답/요청 인터페이스 참조 시 사용
