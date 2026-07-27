import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Banknote,
  CreditCard,
  QrCode,
  X,
  CheckCircle,
} from 'lucide-react-native';
import { useCheckout } from '../../hooks/useCheckout';
import { formatRupiah } from '../../utils/image';
import type { CartItem, PaymentMethod } from '../../types/database';

interface CheckoutModalProps {
  cartItems: CartItem[];
  grandTotal: number;
  onCheckoutComplete: () => void;
  onClose: () => void;
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'card', label: 'Card', icon: CreditCard },
  { key: 'qris', label: 'QR / E-Wallet', icon: QrCode },
];

export function CheckoutModal({
  cartItems,
  grandTotal,
  onCheckoutComplete,
  onClose,
}: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const { processCheckout, isProcessing, error } = useCheckout();
  const [success, setSuccess] = useState(false);

  const handleCheckout = async () => {
    if (!selectedMethod) return;

    const result = await processCheckout(selectedMethod, cartItems);
    if (result) {
      setSuccess(true);
    } else {
      Alert.alert('Checkout Failed', error ?? 'An unexpected error occurred.');
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-8">
        <View className="w-20 h-20 rounded-full bg-success-50 items-center justify-center mb-4">
          <CheckCircle size={48} color="#22c55e" />
        </View>
        <Text className="text-xl font-bold text-gray-900 mb-2">
          Checkout Successful!
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          {formatRupiah(grandTotal)} paid via{' '}
          {PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label}
        </Text>
        <TouchableOpacity
          onPress={onCheckoutComplete}
          className="bg-primary-500 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold text-base">Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-6 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-900">Checkout</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* Order summary */}
        <View className="bg-gray-50 rounded-xl p-4">
          <Text className="text-sm text-gray-500 mb-1">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </Text>
          <Text className="text-2xl font-bold text-gray-900">
            {formatRupiah(grandTotal)}
          </Text>
        </View>
      </View>

      {/* Payment method selection */}
      <View className="flex-1 px-4 pt-6">
        <Text className="text-sm font-semibold text-gray-700 mb-4">
          Select Payment Method
        </Text>

        <View className="gap-3">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.key;
            const Icon = method.icon;
            return (
              <TouchableOpacity
                key={method.key}
                onPress={() => setSelectedMethod(method.key)}
                className={`flex-row items-center p-4 rounded-xl border-2 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    isSelected ? 'bg-primary-500' : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    size={24}
                    color={isSelected ? 'white' : '#4b5563'}
                  />
                </View>
                <Text
                  className={`ml-4 text-base font-medium ${
                    isSelected ? 'text-primary-700' : 'text-gray-800'
                  }`}
                >
                  {method.label}
                </Text>
                {isSelected && (
                  <View className="ml-auto">
                    <CheckCircle size={20} color="#2563eb" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Pay button */}
      <View className="px-4 pb-8 pt-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={!selectedMethod || isProcessing}
          className={`flex-row items-center justify-center rounded-xl py-3.5 ${
            !selectedMethod || isProcessing
              ? 'bg-gray-300'
              : 'bg-primary-500'
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold text-base">
              Pay {formatRupiah(grandTotal)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
