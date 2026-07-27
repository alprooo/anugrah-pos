import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react-native';
import type { CartItem } from '../types/database';
import { formatRupiah } from '../utils/image';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  maxQuantity: (productId: string) => number;
}

export function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  maxQuantity,
}: CartProps) {
  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ShoppingCart size={48} color="#9ca3af" />
        <Text className="text-gray-400 text-lg mt-4 font-medium">
          Cart is empty
        </Text>
        <Text className="text-gray-400 text-sm mt-1">
          Scan or search items to start
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.product.id}
      contentContainerClassName="px-4 pb-4"
      renderItem={({ item }) => {
        const maxQty = maxQuantity(item.product.id);
        const lineTotal = item.product.price * item.quantity;

        return (
          <View className="flex-row items-center bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
            {/* Thumbnail */}
            {item.product.image_url ? (
              <Image
                source={{ uri: item.product.image_url }}
                className="w-12 h-12 rounded-lg bg-gray-100"
              />
            ) : (
              <View className="w-12 h-12 rounded-lg bg-gray-100 items-center justify-center">
                <ShoppingCart size={20} color="#9ca3af" />
              </View>
            )}

            {/* Info */}
            <View className="flex-1 ml-3">
              <Text
                className="text-sm font-medium text-gray-800"
                numberOfLines={1}
              >
                {item.product.name}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {formatRupiah(item.product.price)} each
              </Text>
              <Text className="text-sm font-bold text-gray-900 mt-1">
                {formatRupiah(lineTotal)}
              </Text>
            </View>

            {/* Quantity controls */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() =>
                  onUpdateQuantity(item.product.id, item.quantity - 1)
                }
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                {item.quantity <= 1 ? (
                  <Trash2 size={14} color="#ef4444" />
                ) : (
                  <Minus size={14} color="#4b5563" />
                )}
              </TouchableOpacity>

              <Text className="text-base font-semibold text-gray-800 w-8 text-center">
                {item.quantity}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  onUpdateQuantity(item.product.id, item.quantity + 1)
                }
                disabled={item.quantity >= maxQty}
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  item.quantity >= maxQty
                    ? 'bg-gray-200'
                    : 'bg-primary-100'
                }`}
              >
                <Plus
                  size={14}
                  color={
                    item.quantity >= maxQty ? '#9ca3af' : '#2563eb'
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}
