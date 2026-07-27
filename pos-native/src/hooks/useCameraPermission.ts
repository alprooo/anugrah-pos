import { useCameraPermission } from 'react-native-vision-camera';

export function useCameraPermissionStatus() {
  const { hasPermission, requestPermission } = useCameraPermission();

  return {
    hasPermission,
    requestPermission,
    isDenied: !hasPermission,
  };
}
