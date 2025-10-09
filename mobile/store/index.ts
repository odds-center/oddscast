import { configureStore } from '@reduxjs/toolkit';
import modalReducer from './modalSlice';

export const store = configureStore({
  reducer: {
    modal: modalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Redux에서 React 컴포넌트를 저장할 때 직렬화 체크 무시
        ignoredActions: ['modal/openModal'],
        ignoredPaths: ['modal.component', 'modal.onClose'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
