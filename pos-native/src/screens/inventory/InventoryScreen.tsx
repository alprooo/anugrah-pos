import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Package, Plus, Search } from 'lucide-react-native';
import { useProducts } from '../../hooks/useProducts';
import { useRole } from '../../hooks/useRole';
import { formatRupiah } from '../../utils/image';
import type { ProductWithInventory } from '../../types/database';

export function InventoryScreen({ navigation }: any) {
  const { products, isLoading, error, refetch } = useProducts();
  const { isAdmin } = useRole();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode?.includes(searchQuery) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  const getStockColor = (item: ProductWithInventory) => {
    if (!item.inventory) return 'text-gray-400';
    const qty = item.inventory.quantity_on_hand;
    const threshold = item.inventory.reorder_threshold;
    if (qty > threshold) return 'text-success-500';
    if (qty === threshold) return 'text-warning-500';
    return 'text-danger-500';
  };

  const getStockBgColor = (item: ProductWithInventory) => {
    if (!item.inventory) return 'bg-gray-50';
    const qty = item.inventory.quantity_on_hand;
    const threshold = item.inventory.reorder_threshold;
    if (qty > threshold) return 'bg-success-50';
    if (qty === threshold) return 'bg-warning-50';
    return 'bg-danger-50';
  };

  const renderProduct = ({ item }: { item: ProductWithInventory }) => (
    <TouchableOpacity
      onPress={() => {
        if (isAdmin) {
          navigation.navigate('EditProduct', { product: item });
        }
      }}
      className="flex-row items-center bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100"
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          className="w-14 h-14 rounded-xl bg-gray-100"
        />
      ) : (
        <View className="w-14 h-14 rounded-xl bg-gray-100 items-center justify-center">
          <Package size={24} color="#9ca3af" />
        </View>
      )}

      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {item.barcode ?? item.sku ?? 'No code'}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-xs font-medium text-gray-700">
            {formatRupiah(item.price)}
          </Text>
          <Text className="text-xs text-gray-400 mx-1">·</Text>
          <Text className={`text-xs font-medium ${getStockColor(item)}`}>
            {item.inventory
              ? `Stock: ${item.inventory.quantity_on_hand}`
              : 'No stock data'}
          </Text>
        </View>
      </View>

      {/* Stock badge */}
      {item.inventory && (
        <View
          className={`px-2.5 py-1 rounded-lg ${getStockBgColor(item)}`}
        >
          <Text className={`text-xs font-bold ${getStockColor(item)}`}>
            {item.inventory.quantity_on_hand <= item.inventory.reorder_threshold
              ? 'Reorder'
              : 'In Stock'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-14 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-900">Inventory</Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddProduct')}
              className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center"
            >
              <Plus size={22} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
          <Search size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Search inventory..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Product list */}
      <FlatList
        className="flex-1 px-4 pt-3"
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Package size={48} color="#d1d5db" />
            <Text className="text-gray-400 text-lg mt-4 font-medium">
              {searchQuery ? 'No products found' : 'No products yet'}
            </Text>
            {isAdmin && !searchQuery && (
              <TouchableOpacity
                onPress={() => navigation.navigate('AddProduct')}
                className="mt-4 bg-primary-500 px-6 py-2.5 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  Add First Product
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}
