import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Receipt } from 'lucide-react-native';
import { useOrderDetail } from '../../hooks/useOrders';
import { formatRupiah } from '../../utils/image';

export function OrderDetailScreen({ navigation, route }: any) {
  const { order, isLoading, error, fetchOrderDetail } = useOrderDetail();

  useEffect(() => {
    fetchOrderDetail(route.params.orderId);
  }, [route.params.orderId]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-8">
        <Text className="text-gray-500 text-center">
          {error ?? 'Order not found'}
        </Text>
      </View>
    );
  }

  const paymentLabel =
    order.payment_method === 'cash'
      ? 'Cash'
      : order.payment_method === 'card'
        ? 'Card'
        : order.payment_method === 'qris'
          ? 'QR / E-Wallet'
          : order.payment_method;

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
            Order Details
          </Text>
        </View>
      </View>

      {/* Receipt-style content */}
      <View className="flex-1 px-4 pt-4">
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {/* Receipt header */}
          <View className="items-center mb-6 pb-6 border-b border-dashed border-gray-200">
            <Receipt size={32} color="#3b82f6" />
            <Text className="text-lg font-bold text-gray-900 mt-2">
              Precision POS
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Order #{order.id.slice(0, 8)}
            </Text>
            <Text className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {/* Payment method */}
          <View className="flex-row justify-between mb-4">
            <Text className="text-sm text-gray-500">Payment Method</Text>
            <Text className="text-sm font-medium text-gray-800">
              {paymentLabel}
            </Text>
          </View>

          {/* Line items */}
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Items
          </Text>

          {order.items.map((item: any, index: number) => (
            <View
              key={item.id ?? index}
              className="flex-row items-center py-2 border-b border-gray-50"
            >
              <View className="flex-1">
                <Text className="text-sm text-gray-800" numberOfLines={1}>
                  {item.product_name ?? `Product #${item.product_id.slice(0, 8)}`}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 mx-2">
                {item.quantity}x
              </Text>
              <Text className="text-sm font-medium text-gray-800 w-24 text-right">
                {formatRupiah(item.unit_price * item.quantity)}
              </Text>
            </View>
          ))}

          {/* Total */}
          <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <Text className="text-base font-bold text-gray-900">Total</Text>
            <Text className="text-xl font-bold text-gray-900">
              {formatRupiah(order.total)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
