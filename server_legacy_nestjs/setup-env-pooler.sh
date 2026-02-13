#!/bin/bash

# Supabase Connection Pooler 사용 (IPv4 + 성능 향상)

export SUPABASE_DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
export SUPABASE_DB_PORT=6543
export SUPABASE_DB_USER=postgres.qayqwpfpwiuutxdkihit
export SUPABASE_DB_PASSWORD=[YOUR-PASSWORD]
export SUPABASE_DB_NAME=postgres

export NODE_ENV=development
export PORT=3002
export DB_LOGGING=true

export KRA_API_KEY=yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D
export GOOGLE_CLIENT_ID=297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export GOOGLE_CALLBACK_URL=http://localhost:3002/api/v1/auth/google/callback

export JWT_SECRET=goldenrace-super-secret-jwt-key-2024
export JWT_EXPIRES_IN=30d
export REFRESH_TOKEN_SECRET=goldenrace-refresh-secret-2024
export REFRESH_TOKEN_EXPIRES_IN=90d

export FRONTEND_URL=http://localhost:3000
export CORS_ORIGINS=http://localhost:3000,http://localhost:3001,exp://localhost:19000

export BATCH_ENABLED=true

echo "✅ Supabase Connection Pooler 환경변수 설정 완료!"
echo "Host: $SUPABASE_DB_HOST"
echo "Port: $SUPABASE_DB_PORT (Connection Pooling)"
echo ""
echo "서버 실행: npm run start:dev"
