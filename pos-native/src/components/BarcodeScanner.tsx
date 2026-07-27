import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
  isScannedCode,
} from 'react-native-vision-camera';
import type { TorchMode } from 'react-native-vision-camera';
import { X, Zap, ZapOff } from 'lucide-react-native';

interface BarcodeScannerProps {
  isActive: boolean;
  onBarcodeScanned: (barcode: string) => void;
  onClose?: () => void;
}

export function BarcodeScanner({
  isActive,
  onBarcodeScanned,
  onClose,
}: BarcodeScannerProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [torchMode, setTorchMode] = React.useState<TorchMode>('off');

  const objectOutput = useObjectOutput({
    types: ['ean-13', 'ean-8', 'upc-e', 'code-128'],
    onObjectsScanned: useCallback(
      (objects: any) => {
        for (const obj of objects) {
          if (isScannedCode(obj) && obj.value) {
            onBarcodeScanned(obj.value);
          }
        }
      },
      [onBarcodeScanned],
    ),
  });

  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  if (!hasPermission) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Camera Permission Required
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          Precision POS needs camera access to scan product barcodes.
        </Text>
        <TouchableOpacity
          onPress={handleRequestPermission}
          className="bg-primary-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          No Camera Found
        </Text>
        <Text className="text-gray-500 text-center">
          This device does not have a rear-facing camera.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        outputs={[objectOutput]}
        torchMode={torchMode}
      />

      {/* Viewfinder overlay */}
      <View className="flex-1">
        {/* Top bar */}
        <View className="flex-row justify-between items-center px-4 pt-14 pb-4">
          {onClose ? (
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <X size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity
            onPress={() =>
              setTorchMode(torchMode === 'on' ? 'off' : 'on')
            }
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            {torchMode === 'on' ? (
              <Zap size={24} color="#facc15" />
            ) : (
              <ZapOff size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Center viewfinder frame */}
        <View className="flex-1 items-center justify-center">
          <View className="w-64 h-48 rounded-xl border-2 border-white/60 relative">
            {/* Corner brackets */}
            <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl" />
            <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr" />
            <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl" />
            <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br" />
          </View>
          <Text className="text-white/80 text-sm mt-6">
            Align barcode within the frame
          </Text>
        </View>
      </View>
    </View>
  );
}
