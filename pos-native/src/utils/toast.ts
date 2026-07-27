import Toast from 'react-native-toast-message';

export function showSuccessToast(message: string, description?: string) {
  Toast.show({
    type: 'success',
    text1: message,
    text2: description,
    position: 'top',
    visibilityTime: 3000,
  });
}

export function showErrorToast(message: string, description?: string) {
  Toast.show({
    type: 'error',
    text1: message,
    text2: description,
    position: 'top',
    visibilityTime: 4000,
  });
}

export function showInfoToast(message: string, description?: string) {
  Toast.show({
    type: 'info',
    text1: message,
    text2: description,
    position: 'top',
    visibilityTime: 3000,
  });
}
