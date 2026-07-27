import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X, Zap, ZapOff, Smartphone, Camera as CameraIcon } from 'lucide-react-native';

interface BarcodeScannerProps {
  isActive: boolean;
  onBarcodeScanned: (barcode: string) => void;
  onClose?: () => void;
}

/**
 * BarcodeScanner uses react-native-vision-camera for native barcode scanning.
 * Falls back gracefully when native modules aren't available (e.g., Expo Go).
 */
export function BarcodeScanner({
  isActive,
  onBarcodeScanned,
  onClose,
}: BarcodeScannerProps) {
  const [nativeAvailable, setNativeAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if vision-camera native module is available
    try {
      // Dynamic import to avoid crashing in Expo Go
      const VisionCamera = require('react-native-vision-camera');
      setNativeAvailable(!!VisionCamera.Camera);
    } catch {
      setNativeAvailable(false);
    }
  }, []);

  // Loading state
  if (nativeAvailable === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Text className="text-gray-500">Loading camera...</Text>
      </View>
    );
  }

  // VisionCamera not available (Expo Go) — show fallback
  if (!nativeAvailable) {
    return <BarcodeScannerFallback onClose={onClose} />;
  }

  // Native camera available — render real scanner
  return <NativeBarcodeScanner isActive={isActive} onBarcodeScanned={onBarcodeScanned} onClose={onClose} />;
}

/**
 * Fallback shown when running in Expo Go without native modules.
 */
function BarcodeScannerFallback({ onClose }: { onClose?: () => void }) {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <Text className="text-lg font-bold text-gray-900">Scan Barcode</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#4b5563" />
          </TouchableOpacity>
        )}
      </View>

      {/* Fallback content */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 rounded-full bg-amber-50 items-center justify-center mb-6">
          <Smartphone size={48} color="#d97706" />
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          Native Camera Unavailable
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-2">
          Barcode scanning requires a development build with native modules.
        </Text>
        <Text className="text-sm text-gray-400 text-center">
          In Expo Go, please use the manual barcode entry on the POS screen instead.
        </Text>

        <View className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-4 w-full">
          <Text className="text-sm font-medium text-amber-800 text-center">
            To enable native scanning, build with:
          </Text>
          <Text className="text-xs text-amber-700 text-center mt-2 font-mono">
            npx expo run:android
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Native barcode scanner using react-native-vision-camera v5.
 * Only loaded when native modules are available.
 */
function NativeBarcodeScanner({
  isActive,
  onBarcodeScanned,
  onClose,
}: BarcodeScannerProps) {
  const {
    Camera,
    useCameraDevice,
    useCameraPermission,
    useObjectOutput,
    isScannedCode,
  } = require('react-native-vision-camera');

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [torchMode, setTorchMode] = useState<'off' | 'on'>('off');

  const objectOutput = useObjectOutput({
    types: ['ean-13', 'ean-8', 'upc-e', 'code-128'],
    onObjectsScanned: useCallback(
      (objects: any[]) => {
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
        <View className="w-20 h-20 rounded-full bg-primary-50 items-center justify-center mb-4">
          <CameraIcon size={40} color="#3b82f6" />
        </View>
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
            onPress={() => setTorchMode(torchMode === 'on' ? 'off' : 'on')}
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
