import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { setGlobalAlertRef } from '@/utils/alert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AlertContextType {
  showAlert: (
    title: string,
    message: string,
    buttons?: AlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[] = [{ text: '확인' }],
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      type,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  // 전역 Alert 참조 설정
  useEffect(() => {
    setGlobalAlertRef({ showAlert });
    return () => setGlobalAlertRef(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        type={alertState.type}
        onDismiss={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
