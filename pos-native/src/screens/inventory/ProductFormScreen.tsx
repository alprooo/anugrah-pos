import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Scan,
  Camera,
  ImagePlus,
  ArrowLeft,
  Save,
  AlertTriangle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { compressImage, formatRupiah, generateFilePath } from '../../utils/image';
import { STORAGE_BUCKETS } from '../../lib/constants';
import { useBarcodeDuplicateCheck } from '../../hooks/useBarcodeDuplicateCheck';
import type { ProductWithInventory } from '../../types/database';

interface ProductFormScreenProps {
  navigation: any;
  route?: {
    params?: {
      product?: ProductWithInventory;
    };
  };
}

export function ProductFormScreen({ navigation, route }: ProductFormScreenProps) {
  const existingProduct = route?.params?.product;
  const isEditing = !!existingProduct;

  // Form fields
  const [name, setName] = useState(existingProduct?.name ?? '');
  const [barcode, setBarcode] = useState(existingProduct?.barcode ?? '');
  const [sku, setSku] = useState(existingProduct?.sku ?? '');
  const [price, setPrice] = useState(
    existingProduct ? String(existingProduct.price) : '',
  );
  const [cost, setCost] = useState(
    existingProduct?.cost !== null && existingProduct?.cost !== undefined
      ? String(existingProduct.cost)
      : '',
  );
  const [stock, setStock] = useState(
    existingProduct?.inventory
      ? String(existingProduct.inventory.quantity_on_hand)
      : '',
  );
  const [description, setDescription] = useState(
    existingProduct?.description ?? '',
  );
  const [imageUri, setImageUri] = useState<string | null>(
    existingProduct?.image_url ?? null,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Duplicate barcode check
  const {
    isDuplicate,
    existingProductName,
    isChecking: isCheckingDuplicate,
  } = useBarcodeDuplicateCheck(
    barcode,
    existingProduct?.id ?? null,
  );

  // Open scanner for barcode field
  const handleScanBarcode = useCallback(() => {
    // We'll open the scanner via the POS screen or a modal
    // For now, navigate to a scanner or use a callback
    Alert.alert('Scan Barcode', 'Scanner will open here.');
  }, []);

  // Pick image from gallery
  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  // Capture image with camera
  const handleCaptureImage = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to capture product images.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  // Upload image and return URL
  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri || imageUri === existingProduct?.image_url) {
      return existingProduct?.image_url ?? null;
    }

    try {
      setIsUploadingImage(true);
      const compressedUri = await compressImage(imageUri);
      const fileName = compressedUri.split('/').pop() ?? 'product.jpg';
      const filePath = generateFilePath('products', fileName);

      const formData = {
        uri: compressedUri,
        type: 'image/jpeg',
        name: fileName,
      } as any;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
        .upload(filePath, formData, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      Alert.alert('Upload Failed', 'Could not upload product image.');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save product
  const handleSave = useCallback(async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Product name is required.');
      return;
    }
    if (!barcode.trim() && !sku.trim()) {
      Alert.alert(
        'Validation Error',
        'At least a barcode or SKU is required.',
      );
      return;
    }
    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation Error', 'Price must be a positive number.');
      return;
    }
    if (isDuplicate) {
      Alert.alert(
        'Duplicate Barcode',
        `Product "${existingProductName}" already uses this barcode.`,
      );
      return;
    }

    try {
      setIsSaving(true);

      // Upload image if changed
      const imageUrl = await uploadImage();

      const productData = {
        name: name.trim(),
        barcode: barcode.trim() || null,
        sku: sku.trim() || null,
        price: priceNum,
        cost: cost ? parseInt(cost, 10) : null,
        description: description.trim() || null,
        image_url: imageUrl,
      };

      if (isEditing && existingProduct) {
        // Update existing product
        const { error: productError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', existingProduct.id);

        if (productError) throw productError;

        // Update inventory if stock changed
        const stockNum = stock ? parseInt(stock, 10) : 0;
        if (stockNum !== existingProduct.inventory?.quantity_on_hand) {
          const { error: inventoryError } = await supabase
            .from('inventory')
            .update({ quantity_on_hand: stockNum })
            .eq('product_id', existingProduct.id);

          if (inventoryError) throw inventoryError;
        }

        Alert.alert('Success', 'Product updated successfully.');
      } else {
        // Insert new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (productError) throw productError;

        // Create inventory record
        const stockNum = stock ? parseInt(stock, 10) : 0;
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            product_id: newProduct!.id,
            quantity_on_hand: stockNum,
            reorder_threshold: 5,
          });

        if (inventoryError) throw inventoryError;

        Alert.alert('Success', 'Product added successfully.');
      }

      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save product';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  }, [
    name,
    barcode,
    sku,
    price,
    cost,
    stock,
    description,
    imageUri,
    isDuplicate,
    existingProductName,
    isEditing,
    existingProduct,
    navigation,
  ]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-14 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <ArrowLeft size={24} color="#4b5563" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900 ml-2">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-20">
        {/* Image section */}
        <View className="items-center mb-6">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              className="w-32 h-32 rounded-xl bg-gray-200"
            />
          ) : (
            <View className="w-32 h-32 rounded-xl bg-gray-200 items-center justify-center border-2 border-dashed border-gray-300">
              <Camera size={36} color="#9ca3af" />
              <Text className="text-gray-400 text-xs mt-2">No Image</Text>
            </View>
          )}
          <View className="flex-row mt-3 gap-2">
            <TouchableOpacity
              onPress={handleCaptureImage}
              className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg"
            >
              <Camera size={16} color="#4b5563" />
              <Text className="text-gray-700 text-sm ml-1.5">Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickImage}
              className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg"
            >
              <ImagePlus size={16} color="#4b5563" />
              <Text className="text-gray-700 text-sm ml-1.5">Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form fields */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 gap-4">
          {/* Name */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Name <Text className="text-danger-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-base"
              placeholder="Product name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Barcode */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Barcode
              {!barcode && !sku && <Text className="text-danger-500"> *</Text>}
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-base"
                placeholder="Barcode number"
                placeholderTextColor="#9ca3af"
                value={barcode}
                onChangeText={setBarcode}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                onPress={handleScanBarcode}
                className="bg-primary-500 px-3 rounded-lg items-center justify-center"
              >
                <Scan size={20} color="white" />
              </TouchableOpacity>
            </View>
            {/* Duplicate warning */}
            {isCheckingDuplicate && (
              <Text className="text-xs text-gray-500 mt-1">
                Checking barcode...
              </Text>
            )}
            {isDuplicate && !isCheckingDuplicate && (
              <View className="flex-row items-center mt-1">
                <AlertTriangle size={14} color="#f59e0b" />
                <Text className="text-xs text-warning-700 ml-1">
                  Already exists: "{existingProductName}"
                </Text>
              </View>
            )}
          </View>

          {/* SKU */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              SKU
              {!barcode && !sku && <Text className="text-danger-500"> *</Text>}
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-base"
              placeholder="Stock keeping unit"
              placeholderTextColor="#9ca3af"
              value={sku}
              onChangeText={setSku}
              autoCapitalize="characters"
            />
          </View>

          {/* Price & Cost row */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Price (Rp) <Text className="text-danger-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-base"
                placeholder="0"
                placeholderTextColor="#9ca3af"
                value={price}
                onChangeText={setPrice}
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Cost (Rp)
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-base"
                placeholder="0"
                placeholderTextColor="#9ca3af"
                value={cost}
                onChangeText={setCost}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Stock */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Stock Quantity {!isEditing && <Text className="text-danger-500">*</Text>}
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-base"
              placeholder="0"
              placeholderTextColor="#9ca3af"
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Description
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-base min-h-[80px]"
              placeholder="Product description (optional)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View className="bg-white border-t border-gray-200 px-4 py-4 pb-8">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || isUploadingImage}
          className={`flex-row items-center justify-center rounded-xl py-3.5 ${
            isSaving || isUploadingImage ? 'bg-primary-400' : 'bg-primary-500'
          }`}
        >
          {isSaving || isUploadingImage ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text className="text-white font-semibold text-base ml-2">
                {isEditing ? 'Update Product' : 'Save Product'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
