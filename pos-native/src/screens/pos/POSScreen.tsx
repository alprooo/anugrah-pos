import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Scan, LogOut, ShoppingCart } from 'lucide-react-native';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { ProductSearchBar } from '../../components/ProductSearchBar';
import { Cart } from '../../components/Cart';
import { useCart } from '../../hooks/useCart';
import { useProductByBarcode } from '../../hooks/useProducts';
import { useCheckout } from '../../hooks/useCheckout';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import { formatRupiah } from '../../utils/image';
import { CheckoutModal } from './CheckoutModal';
import { supabase } from '../../lib/supabase';
import type { ProductWithInventory } from '../../types/database';

export function POSScreen() {
  const { signOut } = useAuth();
  const { isAdmin } = useRole();
  const cart = useCart();
  const { findByBarcode } = useProductByBarcode();
  const { processCheckout, isProcessing } = useCheckout();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  // Fetch stock quantities for cart items
  useEffect(() => {
    if (cart.items.length === 0) return;

    const productIds = cart.items.map((item) => item.product.id);
    supabase
      .from('inventory')
      .select('product_id, quantity_on_hand')
      .in('product_id', productIds)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        data?.forEach((inv) => {
          map[inv.product_id] = inv.quantity_on_hand;
        });
        setStockMap(map);
      });
  }, [cart.items.length]);

  const handleBarcodeScanned = useCallback(
    async (barcode: string) => {
      setIsScannerOpen(false);
      const product = await findByBarcode(barcode);
      if (product) {
        cart.addItem(product, 999);
      } else {
        Alert.alert('Product Not Found', `No product with barcode "${barcode}"`);
      }
    },
    [findByBarcode, cart],
  );

  const handleManualBarcode = useCallback(async () => {
    const code = manualBarcode.trim();
    if (!code) return;

    const product = await findByBarcode(code);
    if (product) {
      cart.addItem(product, 999);
      setManualBarcode('');
    } else {
      Alert.alert('Product Not Found', `No product with barcode "${code}"`);
    }
  }, [manualBarcode, findByBarcode, cart]);

  const handleProductSelect = useCallback(
    (product: ProductWithInventory) => {
      cart.addItem(product, 999);
    },
    [cart],
  );

  const handleCheckoutComplete = useCallback(() => {
    cart.clearCart();
    setIsCheckoutOpen(false);
  }, [cart]);

  const maxQuantity = useCallback(
    (productId: string) => stockMap[productId] ?? 999,
    [stockMap],
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-14 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-lg font-bold text-gray-900">POS</Text>
            <Text className="text-xs text-gray-500">
              {isAdmin ? 'Admin' : 'Staff'} mode
            </Text>
          </View>
          <TouchableOpacity
            onPress={signOut}
            className="p-2 rounded-lg bg-gray-100"
          >
            <LogOut size={18} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <ProductSearchBar onProductSelect={handleProductSelect} />
      </View>

      {/* Manual barcode entry */}
      <View className="flex-row items-center px-4 py-2 bg-white border-b border-gray-100 gap-2">
        <TextInput
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-base"
          placeholder="Enter barcode manually..."
          placeholderTextColor="#9ca3af"
          value={manualBarcode}
          onChangeText={setManualBarcode}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={handleManualBarcode}
        />
        <TouchableOpacity
          onPress={handleManualBarcode}
          className="bg-primary-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium text-sm">Add</Text>
        </TouchableOpacity>
      </View>

      {/* Cart */}
      <View className="flex-1">
        <Cart
          items={cart.items}
          onUpdateQuantity={cart.updateQuantity}
          onRemoveItem={cart.removeItem}
          maxQuantity={maxQuantity}
        />
      </View>

      {/* Bottom bar */}
      {cart.items.length > 0 && (
        <View className="bg-white border-t border-gray-200 px-4 py-4 pb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-500 text-sm">
              {cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''}
            </Text>
            <Text className="text-xl font-bold text-gray-900">
              {formatRupiah(cart.grandTotal)}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setIsScannerOpen(true)}
              className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-xl py-3"
            >
              <Scan size={20} color="#4b5563" />
              <Text className="text-gray-700 font-semibold ml-2">Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsCheckoutOpen(true)}
              disabled={isProcessing}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
                isProcessing ? 'bg-primary-400' : 'bg-primary-500'
              }`}
            >
              <ShoppingCart size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                {isProcessing ? 'Processing...' : 'Checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Scanner Modal */}
      <Modal
        visible={isScannerOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsScannerOpen(false)}
      >
        <BarcodeScanner
          isActive={isScannerOpen}
          onBarcodeScanned={handleBarcodeScanned}
          onClose={() => setIsScannerOpen(false)}
        />
      </Modal>

      {/* Checkout Modal */}
      <Modal
        visible={isCheckoutOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCheckoutOpen(false)}
      >
        <CheckoutModal
          cartItems={cart.items}
          grandTotal={cart.grandTotal}
          onCheckoutComplete={handleCheckoutComplete}
          onClose={() => setIsCheckoutOpen(false)}
        />
      </Modal>
    </View>
  );
}
