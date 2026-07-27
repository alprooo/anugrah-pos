import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Receipt, CreditCard, Banknote, QrCode } from 'lucide-react-native';
import { useOrders } from '../../hooks/useOrders';
import { formatRupiah } from '../../utils/image';

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  qris: QrCode,
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  qris: 'QR / E-Wallet',
};

export function TransactionsScreen({ navigation }: any) {
  const { orders, isLoading, error, refetch } = useOrders();
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | null>(
    null,
  );

  const filtered = useMemo(() => {
    let result = orders;

    if (paymentFilter) {
      result = result.filter((o) => o.payment_method === paymentFilter);
    }

    if (dateFilter) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      result = result.filter((o) => {
        const orderDate = new Date(o.created_at);
        switch (dateFilter) {
          case 'today':
            return orderDate >= startOfDay;
          case 'week':
            return orderDate >= startOfWeek;
          case 'month':
            return orderDate >= startOfMonth;
          default:
            return true;
        }
      });
    }

    return result;
  }, [orders, paymentFilter, dateFilter]);

  const renderOrder = ({ item }: any) => {
    const PaymentIcon = PAYMENT_ICONS[item.payment_method] ?? Banknote;
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('OrderDetail', { orderId: item.id })
        }
        className="bg-white rounded-xl p-4 mb-2 shadow-sm border border-gray-100"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <PaymentIcon size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1.5">
              {PAYMENT_LABELS[item.payment_method] ?? item.payment_method}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">
            {new Date(item.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-gray-900">
            {formatRupiah(item.total)}
          </Text>
          <View className="bg-gray-100 px-2.5 py-1 rounded-lg">
            <Text className="text-xs text-gray-600 font-medium">
              #{item.id.slice(0, 8)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterChip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full ${
        active ? 'bg-primary-500' : 'bg-gray-100'
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          active ? 'text-white' : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-14 pb-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Transactions
        </Text>

        {/* Filters */}
        <View className="flex-row gap-2 mb-2">
          <FilterChip
            label="Today"
            active={dateFilter === 'today'}
            onPress={() =>
              setDateFilter(dateFilter === 'today' ? null : 'today')
            }
          />
          <FilterChip
            label="This Week"
            active={dateFilter === 'week'}
            onPress={() =>
              setDateFilter(dateFilter === 'week' ? null : 'week')
            }
          />
          <FilterChip
            label="This Month"
            active={dateFilter === 'month'}
            onPress={() =>
              setDateFilter(dateFilter === 'month' ? null : 'month')
            }
          />
        </View>
        <View className="flex-row gap-2">
          <FilterChip
            label="All"
            active={!paymentFilter}
            onPress={() => setPaymentFilter(null)}
          />
          <FilterChip
            label="Cash"
            active={paymentFilter === 'cash'}
            onPress={() =>
              setPaymentFilter(paymentFilter === 'cash' ? null : 'cash')
            }
          />
          <FilterChip
            label="Card"
            active={paymentFilter === 'card'}
            onPress={() =>
              setPaymentFilter(paymentFilter === 'card' ? null : 'card')
            }
          />
          <FilterChip
            label="QR"
            active={paymentFilter === 'qris'}
            onPress={() =>
              setPaymentFilter(paymentFilter === 'qris' ? null : 'qris')
            }
          />
        </View>
      </View>

      {/* Order list */}
      <FlatList
        className="flex-1 px-4 pt-3"
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Receipt size={48} color="#d1d5db" />
            <Text className="text-gray-400 text-lg mt-4 font-medium">
              No transactions yet
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Completed checkouts will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}
