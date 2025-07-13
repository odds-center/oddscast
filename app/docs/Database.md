# 데이터베이스 (Database)

본 문서는 Golden Race 앱에서 사용되는 Supabase 데이터베이스의 스키마, 테이블 관계, 주요 함수 및 트리거에 대해 설명합니다.

## 1. `public.profiles` 테이블

사용자 프로필 정보를 저장하는 테이블입니다. `auth.users` 테이블과 1:1 관계를 가집니다.

### 1.1. 스키마 정의

```sql
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE,
  username text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  notifications_enabled BOOLEAN DEFAULT TRUE
);
```

### 1.2. `handle_new_user` 함수 및 `on_auth_user_created` 트리거

새로운 사용자가 `auth.users` 테이블에 생성될 때, 해당 사용자의 기본 프로필 정보를 `public.profiles` 테이블에 자동으로 삽입합니다. Google 로그인 시 `raw_user_meta_data`에서 사용자 이름을 추출하여 `username` 필드에 저장합니다.

```sql
-- Creates a public.profiles table for public user data
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers handle_new_user function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.3. `handle_profile_update` 함수 및 `on_profile_updated` 트리거

`public.profiles` 테이블의 행이 업데이트될 때마다 `updated_at` 필드를 현재 시간으로 자동 갱신합니다.

```sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function on profile update
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();
```

### 1.4. 기존 사용자 데이터 마이그레이션

`profiles` 테이블 및 관련 트리거 설정 이전에 가입한 기존 사용자들의 프로필 데이터를 `auth.users` 테이블에서 `profiles` 테이블로 마이그레이션하는 쿼리입니다. 이미 존재하는 `id`에 대해서는 충돌을 무시합니다.

```sql
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

## 2. `public.races` 테이블

경주 정보를 저장하는 테이블입니다.

### 2.1. 스키마 정의 (예시)

```sql
CREATE TABLE public.races (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_number INT NOT NULL,
  race_name TEXT NOT NULL,
  venue TEXT NOT NULL,
  race_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT '예정',
  -- horses JSONB, -- 말 정보는 별도 테이블 또는 상세 JSON으로 관리 가능
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 3. RLS (Row Level Security) 정책

Supabase의 RLS는 데이터베이스 행 수준에서 접근 권한을 제어합니다. 예를 들어, `profiles` 테이블의 경우 사용자가 자신의 프로필만 조회하고 업데이트할 수 있도록 정책이 설정되어야 합니다.

### 3.1. `profiles` 테이블 RLS 정책 (예시)

*   **SELECT 정책 (모든 사용자 자신의 프로필 조회 허용):**
    ```sql
    CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
    ```
*   **INSERT 정책 (새로운 사용자 프로필 생성 허용 - 트리거에 의해):**
    ```sql
    CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
    ```
*   **UPDATE 정책 (사용자 자신의 프로필 업데이트 허용):**
    ```sql
    CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
    ```

## 4. Supabase 설정

### 4.1. JWT 만료 기간 설정

사용자 세션의 유지 기간을 설정합니다. Supabase 대시보드의 `Authentication` -> `Settings` (또는 `Configuration`) 섹션에서 `JWT expiry` 필드를 찾아 원하는 기간(예: 30일 = 2,592,000초)으로 설정할 수 있습니다.

### 4.2. Google OAuth 설정

Google 로그인을 위한 OAuth 클라이언트 ID 설정은 Supabase 대시보드의 `Authentication` -> `Providers` 섹션에서 이루어집니다.
