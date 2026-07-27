import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Search, X, ShoppingCart } from 'lucide-react-native';
import { useProductSearch } from '../hooks/useProducts';
import type { ProductWithInventory } from '../types/database';
import { DEBOUNCE_MS } from '../lib/constants';
import { formatRupiah } from '../utils/image';

interface ProductSearchBarProps {
  onProductSelect: (product: ProductWithInventory) => void;
  placeholder?: string;
}

export function ProductSearchBar({
  onProductSelect,
  placeholder = 'Search products by name, barcode, or SKU...',
}: ProductSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { results, isSearching, search } = useProductSearch();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (text: string) => {
      setQuery(text);
      setShowResults(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        search(text);
      }, DEBOUNCE_MS);
    },
    [search],
  );

  const handleSelect = useCallback(
    (product: ProductWithInventory) => {
      onProductSelect(product);
      setQuery('');
      setShowResults(false);
    },
    [onProductSelect],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setShowResults(false);
    setQuery('');
  }, []);

  return (
    <View className="relative z-50">
      {/* Search input */}
      <View className="flex-row items-center bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200">
        <Search size={18} color="#9ca3af" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-800 h-10"
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={handleChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} className="p-1">
            <X size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
        {isSearching && (
          <ActivityIndicator size="small" color="#3b82f6" className="ml-2" />
        )}
      </View>

      {/* Search results dropdown */}
      {showResults && query.length > 0 && (
        <View className="absolute top-14 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 z-50">
          {results.length === 0 && !isSearching ? (
            <View className="py-8 items-center">
              <Text className="text-gray-400 text-sm">No products found</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  className="flex-row items-center px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      className="w-10 h-10 rounded-lg bg-gray-100"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center">
                      <ShoppingCart size={18} color="#9ca3af" />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-medium text-gray-800">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {item.barcode ?? item.sku ?? 'No code'}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-900">
                    {formatRupiah(item.price)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
