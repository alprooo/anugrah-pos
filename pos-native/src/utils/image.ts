import * as ImageManipulator from 'expo-image-manipulator';
import { IMAGE_COMPRESSION } from '../lib/constants';

export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: IMAGE_COMPRESSION.MAX_DIMENSION } }],
    {
      compress: IMAGE_COMPRESSION.QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return result.uri;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateFilePath(userId: string, fileName: string): string {
  const ext = fileName.split('.').pop() ?? 'jpg';
  return `${userId}/${Date.now()}.${ext}`;
}
