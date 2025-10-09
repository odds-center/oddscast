import { setupServer } from 'msw/native';
import { handlers } from './handlers';

// MSW 서버 설정 (React Native용)
export const server = setupServer(...handlers);
