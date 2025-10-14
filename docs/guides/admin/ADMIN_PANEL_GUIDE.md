# 📊 Admin Panel 개발 가이드

**버전**: 2.0.0  
**최종 업데이트**: 2025년 10월 14일  
**상태**: ✅ 완료

---

## 📋 목차

1. [개요](#개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [핵심 개념](#핵심-개념)
5. [개발 가이드](#개발-가이드)
6. [API 통합](#api-통합)
7. [베스트 프랙티스](#베스트-프랙티스)
8. [트러블슈팅](#트러블슈팅)

---

## 개요

Golden Race Admin Panel은 Next.js 기반의 관리자 대시보드로, 사용자, 베팅, 경주, 구독, AI 설정 등을 관리합니다.

### 주요 기능

- 👥 **사용자 관리** - 회원 조회, 상세 정보, 통계
- 🎯 **베팅 관리** - 베팅 내역, 승률, ROI 분석
- 🏇 **경주 관리** - 경주 일정, 결과, 통계
- 💳 **구독 관리** - 플랜 설정, 가격 조정, 구독 현황
- 🤖 **AI 설정** - 모델 선택, 비용 최적화, 캐싱 설정
- 📢 **알림 발송** - Push Notification 전송

---

## 기술 스택

### 프레임워크

| 기술           | 버전 | 용도                            |
| -------------- | ---- | ------------------------------- |
| **Next.js**    | 14.x | React 프레임워크 (Pages Router) |
| **React**      | 18.x | UI 라이브러리                   |
| **TypeScript** | 5.x  | 타입 안정성                     |

### 상태 관리

| 라이브러리          | 용도                          |
| ------------------- | ----------------------------- |
| **TanStack Query**  | 서버 상태 관리, 캐싱, Refetch |
| **React Hook Form** | 폼 상태 관리                  |
| **Zod**             | 스키마 검증                   |

### UI/UX

| 라이브러리          | 용도        |
| ------------------- | ----------- |
| **Tailwind CSS**    | 스타일링    |
| **React Hot Toast** | 토스트 알림 |
| **Heroicons**       | 아이콘      |

### HTTP 클라이언트

| 라이브러리 | 용도                   |
| ---------- | ---------------------- |
| **Axios**  | HTTP 요청, Interceptor |
| **qs**     | 쿼리 스트링 파싱       |

---

## 프로젝트 구조

```
admin/
├── src/
│   ├── pages/                  # Next.js Pages Router
│   │   ├── _app.tsx           # App 진입점
│   │   ├── _document.tsx      # HTML Document
│   │   ├── index.tsx          # 대시보드 홈
│   │   ├── login.tsx          # 로그인
│   │   ├── users.tsx          # 사용자 관리
│   │   ├── bets.tsx           # 베팅 관리
│   │   ├── races.tsx          # 경주 관리
│   │   ├── subscriptions.tsx  # 구독 현황
│   │   ├── subscription-plans.tsx    # 플랜 설정
│   │   ├── single-purchase-config.tsx # 개별 구매 설정
│   │   ├── ai-config.tsx      # AI 설정
│   │   └── notifications.tsx  # 알림 발송
│   │
│   ├── components/            # 공통 컴포넌트
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Modal.tsx
│   │   └── charts/
│   │       └── LineChart.tsx
│   │
│   ├── lib/                   # 유틸리티 및 API
│   │   ├── api/
│   │   │   └── admin.ts       # Admin API Client
│   │   ├── utils/
│   │   │   ├── axios.ts       # Axios 인스턴스
│   │   │   └── toast.ts       # Toast 유틸리티
│   │   └── hooks/
│   │       └── useAuth.ts     # 인증 훅
│   │
│   ├── types/                 # TypeScript 타입
│   │   ├── admin.ts
│   │   ├── user.ts
│   │   └── bet.ts
│   │
│   └── styles/                # 스타일
│       └── globals.css
│
├── public/                    # 정적 파일
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

---

## 핵심 개념

### 1. React Hook Form + Zod

#### 왜 사용하나?

- ✅ **타입 안정성** - Zod 스키마 → TypeScript 타입 자동 추론
- ✅ **선언적 검증** - 복잡한 검증 로직 간소화
- ✅ **성능 최적화** - 불필요한 리렌더링 방지
- ✅ **에러 처리** - 자동 에러 메시지 표시

#### 기본 사용법

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Zod 스키마 정의
const userSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  age: z.number().min(18, '만 18세 이상만 가능합니다'),
});

// 2. TypeScript 타입 자동 추론
type UserFormData = z.infer<typeof userSchema>;

// 3. useForm 초기화
const {
  register, // 입력 필드 등록
  handleSubmit, // 폼 제출 핸들러
  formState: { errors }, // 검증 에러
  watch, // 필드 값 감시
  setValue, // 필드 값 설정
  reset, // 폼 초기화
} = useForm<UserFormData>({
  resolver: zodResolver(userSchema),
  defaultValues: {
    name: '',
    email: '',
    age: 18,
  },
});

// 4. 제출 핸들러
const onSubmit = (data: UserFormData) => {
  // data는 이미 검증된 상태
  console.log(data);
};

// 5. JSX
return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('name')} />
    {errors.name && <span>{errors.name.message}</span>}

    <input {...register('email')} />
    {errors.email && <span>{errors.email.message}</span>}

    <input type='number' {...register('age', { valueAsNumber: true })} />
    {errors.age && <span>{errors.age.message}</span>}

    <button type='submit'>저장</button>
  </form>
);
```

#### 고급 기능

**1. 실시간 필드 감시 (watch)**

```typescript
const watchedName = watch('name');
const watchedEmail = watch('email');

// 모든 필드 감시
const allValues = watch();

// 특정 필드 변경 시 다른 필드 업데이트
useEffect(() => {
  if (watchedName === 'admin') {
    setValue('role', 'ADMIN');
  }
}, [watchedName, setValue]);
```

**2. 동적 필드 배열 (useFieldArray)**

```typescript
import { useFieldArray } from 'react-hook-form';

const { fields, append, remove } = useFieldArray({
  control,
  name: 'items',
});

return (
  <>
    {fields.map((field, index) => (
      <div key={field.id}>
        <input {...register(`items.${index}.name`)} />
        <button onClick={() => remove(index)}>삭제</button>
      </div>
    ))}
    <button onClick={() => append({ name: '' })}>추가</button>
  </>
);
```

**3. 조건부 검증**

```typescript
const schema = z
  .object({
    type: z.enum(['student', 'adult']),
    age: z.number(),
    studentId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'student') {
        return !!data.studentId;
      }
      return true;
    },
    {
      message: '학생증 번호를 입력하세요',
      path: ['studentId'],
    }
  );
```

---

### 2. TanStack Query (React Query)

#### 왜 사용하나?

- ✅ **자동 캐싱** - 불필요한 API 요청 방지
- ✅ **자동 Refetch** - 데이터 최신 상태 유지
- ✅ **로딩/에러 상태** - 선언적 상태 관리
- ✅ **낙관적 업데이트** - UX 개선

#### useQuery (데이터 조회)

```typescript
import { useQuery } from '@tanstack/react-query';
import { AdminUsersApi } from '@/lib/api/admin';

export default function UsersPage() {
  const {
    data, // 조회 결과
    isLoading, // 로딩 중
    isError, // 에러 발생
    error, // 에러 객체
    refetch, // 수동 refetch
  } = useQuery({
    queryKey: ['users'], // 캐시 키
    queryFn: AdminUsersApi.getUsers, // API 함수
    staleTime: 5 * 60 * 1000, // 5분 동안 fresh 상태 유지
    cacheTime: 10 * 60 * 1000, // 10분 동안 캐시 유지
    refetchOnWindowFocus: true, // 창 포커스 시 refetch
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (isError) return <div>오류: {error.message}</div>;

  return (
    <div>
      {data.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
      <button onClick={() => refetch()}>새로고침</button>
    </div>
  );
}
```

#### useMutation (데이터 변경)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminUsersApi } from '@/lib/api/admin';
import { toast } from 'react-hot-toast';

export default function UpdateUserForm() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserDto) => AdminUsersApi.updateUser(data.id, data),
    onSuccess: () => {
      toast.success('사용자 정보가 업데이트되었습니다');
      // 캐시 무효화 → 자동 refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error('업데이트 실패: ' + error.message);
    },
  });

  const handleSubmit = (data: UpdateUserDto) => {
    updateMutation.mutate(data);
  };

  return (
    <button onClick={() => handleSubmit(formData)} disabled={updateMutation.isPending}>
      {updateMutation.isPending ? '저장 중...' : '저장'}
    </button>
  );
}
```

#### 낙관적 업데이트

```typescript
const updateMutation = useMutation({
  mutationFn: AdminUsersApi.updateUser,
  onMutate: async (newData) => {
    // 기존 쿼리 취소
    await queryClient.cancelQueries({ queryKey: ['users'] });

    // 이전 데이터 백업
    const previousUsers = queryClient.getQueryData(['users']);

    // 낙관적 업데이트
    queryClient.setQueryData(['users'], (old) => {
      return old.map((user) => (user.id === newData.id ? { ...user, ...newData } : user));
    });

    return { previousUsers };
  },
  onError: (err, newData, context) => {
    // 에러 시 롤백
    queryClient.setQueryData(['users'], context.previousUsers);
  },
  onSettled: () => {
    // 성공/실패 상관없이 refetch
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

---

### 3. React Hot Toast

#### 왜 사용하나?

- ✅ **모던한 UI** - 아름다운 토스트 디자인
- ✅ **커스터마이징** - 자유로운 스타일링
- ✅ **Promise 지원** - 비동기 작업 상태 자동 표시
- ✅ **경량** - 번들 크기 작음

#### 기본 사용법

```typescript
import { toast } from 'react-hot-toast';

// 성공
toast.success('저장되었습니다');

// 에러
toast.error('오류가 발생했습니다');

// 정보
toast('알림 메시지');

// 로딩
const toastId = toast.loading('처리 중...');
// 완료 후
toast.dismiss(toastId);
toast.success('완료!');

// 커스텀 옵션
toast.success('성공!', {
  duration: 5000,
  position: 'top-right',
  icon: '🎉',
});
```

#### Promise 패턴

```typescript
toast.promise(AdminUsersApi.updateUser(id, data), {
  loading: '업데이트 중...',
  success: '업데이트 완료!',
  error: '업데이트 실패',
});
```

#### 유틸리티 함수 (`lib/utils/toast.ts`)

```typescript
import toast, { ToastOptions } from 'react-hot-toast';

export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, options);
};

export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, options);
};

export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages);
};

export default {
  success: showSuccess,
  error: showError,
  promise: showPromise,
};
```

**사용 예**:

```typescript
import toastUtils from '@/lib/utils/toast';

toastUtils.success('저장되었습니다');
toastUtils.error('오류 발생');
```

---

## 개발 가이드

### 새로운 페이지 추가하기

#### 1. 페이지 파일 생성

**`src/pages/my-feature.tsx`**:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import AdminLayout from '@/components/layout/AdminLayout';
import { MyFeatureApi } from '@/lib/api/admin';

// Zod 스키마
const mySchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  value: z.number().min(0),
});

type MyFormData = z.infer<typeof mySchema>;

export default function MyFeaturePage() {
  const queryClient = useQueryClient();

  // 데이터 조회
  const { data, isLoading } = useQuery({
    queryKey: ['my-feature'],
    queryFn: MyFeatureApi.getData,
  });

  // 폼 초기화
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MyFormData>({
    resolver: zodResolver(mySchema),
  });

  // 데이터 업데이트
  const updateMutation = useMutation({
    mutationFn: MyFeatureApi.updateData,
    onSuccess: () => {
      toast.success('저장되었습니다');
      queryClient.invalidateQueries({ queryKey: ['my-feature'] });
    },
    onError: (error) => {
      toast.error('저장 실패: ' + error.message);
    },
  });

  const onSubmit = (data: MyFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <AdminLayout>
      <h1>My Feature</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register('name')} />
        {errors.name && <span>{errors.name.message}</span>}

        <input type='number' {...register('value', { valueAsNumber: true })} />
        {errors.value && <span>{errors.value.message}</span>}

        <button type='submit' disabled={updateMutation.isPending}>
          {updateMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </form>
    </AdminLayout>
  );
}
```

#### 2. API 클라이언트 추가

**`src/lib/api/admin.ts`**:

```typescript
export class MyFeatureApi {
  static async getData() {
    try {
      const response = await axiosInstance.get('/admin/my-feature');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateData(data: any) {
    try {
      const response = await axiosInstance.post('/admin/my-feature', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
```

#### 3. 사이드바 메뉴 추가

**`src/components/layout/Sidebar.tsx`**:

```typescript
const menuItems = [
  // ...
  { name: 'My Feature', href: '/my-feature', icon: DocumentIcon },
];
```

---

## API 통합

### Axios 인스턴스 설정

**`src/lib/utils/axios.ts`**:

```typescript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 → 로그인 페이지로
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### API 응답/에러 핸들러

```typescript
import { AxiosResponse } from 'axios';

export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

export const handleApiError = (error: any): Error => {
  if (error.response) {
    // 서버 응답 오류
    const message = error.response.data?.message || '서버 오류가 발생했습니다';
    return new Error(message);
  } else if (error.request) {
    // 요청 전송 실패
    return new Error('네트워크 오류가 발생했습니다');
  } else {
    // 기타 오류
    return new Error(error.message || '알 수 없는 오류가 발생했습니다');
  }
};
```

---

## 베스트 프랙티스

### 1. 파일 네이밍

```
✅ 좋은 예:
- subscription-plans.tsx (케밥 케이스)
- ai-config.tsx
- AdminLayout.tsx (컴포넌트는 파스칼 케이스)

❌ 나쁜 예:
- SubscriptionPlans.tsx (페이지는 소문자)
- AI_Config.tsx (언더스코어 사용)
```

### 2. 타입 정의

```typescript
// ✅ 좋은 예: Zod 스키마 + infer
const schema = z.object({ name: z.string() });
type MyType = z.infer<typeof schema>;

// ❌ 나쁜 예: 수동 타입 정의 (중복)
type MyType = { name: string };
```

### 3. 에러 처리

```typescript
// ✅ 좋은 예: useMutation onError
useMutation({
  mutationFn: api.update,
  onError: (error) => {
    toast.error(error.message);
    console.error(error);
  },
});

// ❌ 나쁜 예: try-catch 남발
try {
  await api.update();
} catch (error) {
  // ...
}
```

### 4. 로딩 상태

```typescript
// ✅ 좋은 예: isPending 사용
<button disabled={mutation.isPending}>{mutation.isPending ? '처리 중...' : '제출'}</button>;

// ❌ 나쁜 예: useState로 수동 관리
const [loading, setLoading] = useState(false);
```

---

## 트러블슈팅

### 1. "Module not found" 에러

**증상**:

```
Module not found: Can't resolve '@/lib/api/admin'
```

**해결**:
`tsconfig.json`에서 path alias 확인:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2. Zod 검증 실패

**증상**:

```
ZodError: Expected number, received string
```

**해결**:
`valueAsNumber` 옵션 사용:

```typescript
<input type='number' {...register('age', { valueAsNumber: true })} />
```

### 3. React Query 캐시 업데이트 안 됨

**증상**: Mutation 후에도 화면이 갱신되지 않음

**해결**:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['users'] });
  // 또는
  queryClient.refetchQueries({ queryKey: ['users'] });
};
```

### 4. Toast가 표시되지 않음

**증상**: `toast.success()` 호출했지만 아무것도 안 나옴

**해결**:
`_app.tsx`에 `<Toaster />` 추가 확인:

```typescript
import { Toaster } from 'react-hot-toast';

<Toaster position='top-center' />;
```

---

## 다음 단계

- [ ] [AI Config 가이드](AI_CONFIG_GUIDE.md) - AI 설정 상세 가이드
- [ ] [Subscription 가이드](SUBSCRIPTION_GUIDE.md) - 구독 시스템
- [ ] [Notification 가이드](NOTIFICATION_GUIDE.md) - Push 알림

---

**작성자**: AI Assistant  
**문서 버전**: 2.0.0  
**최종 업데이트**: 2025년 10월 14일
