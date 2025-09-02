import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import React from 'react';

export interface ModalState {
  isOpen: boolean;
  component: React.ReactNode | null;
  title?: string;
  onClose?: () => void;
}

const initialState: ModalState = {
  isOpen: false,
  component: null,
  title: undefined,
  onClose: undefined,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{
        component: React.ReactNode;
        title?: string;
        onClose?: () => void;
      }>
    ) => {
      state.isOpen = true;
      state.component = action.payload.component;
      state.title = action.payload.title;
      state.onClose = action.payload.onClose;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.component = null;
      state.title = undefined;
      state.onClose = undefined;
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
