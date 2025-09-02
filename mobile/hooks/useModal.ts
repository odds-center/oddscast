import { useAppDispatch } from '@/store/hooks';
import { closeModal, openModal } from '@/store/modalSlice';
import React from 'react';

export const useModal = () => {
  const dispatch = useAppDispatch();

  const showModal = (component: React.ReactNode, title?: string, onClose?: () => void) => {
    dispatch(openModal({ component, title, onClose }));
  };

  const hideModal = () => {
    dispatch(closeModal());
  };

  return {
    showModal,
    hideModal,
  };
};
