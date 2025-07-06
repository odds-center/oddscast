#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 개발 환경 설정을 시작합니다...');

// Metro 캐시 클리어
console.log('📦 Metro 캐시를 클리어합니다...');
try {
  execSync('npx expo start --clear --reset-cache', { stdio: 'inherit' });
} catch (error) {
  console.log('Metro 서버가 이미 실행 중입니다.');
}

// node_modules 확인
console.log('📋 의존성을 확인합니다...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('의존성 설치 중 오류가 발생했습니다:', error.message);
}

// Expo 개발 도구 설치 확인
console.log('🔧 Expo 개발 도구를 확인합니다...');
try {
  execSync('npx expo install --fix', { stdio: 'inherit' });
} catch (error) {
  console.error('Expo 도구 설치 중 오류가 발생했습니다:', error.message);
}

console.log('✅ 개발 환경 설정이 완료되었습니다!');
console.log('💡 다음 명령어로 개발 서버를 시작하세요:');
console.log('   npm run start:fast');
