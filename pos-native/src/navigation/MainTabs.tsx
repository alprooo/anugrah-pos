import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShoppingCart, Package, Receipt } from 'lucide-react-native';

import { POSScreen } from '../screens/pos/POSScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { ProductFormScreen } from '../screens/inventory/ProductFormScreen';
import { TransactionsScreen } from '../screens/transactions/TransactionsScreen';
import { OrderDetailScreen } from '../screens/transactions/OrderDetailScreen';

const Tab = createBottomTabNavigator();
const POSStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();
const TransactionsStack = createNativeStackNavigator();

function POSStackScreen() {
  return (
    <POSStack.Navigator screenOptions={{ headerShown: false }}>
      <POSStack.Screen name="POSMain" component={POSScreen} />
    </POSStack.Navigator>
  );
}

function InventoryStackScreen() {
  return (
    <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
      <InventoryStack.Screen name="InventoryMain" component={InventoryScreen} />
      <InventoryStack.Screen name="AddProduct" component={ProductFormScreen} />
      <InventoryStack.Screen
        name="EditProduct"
        component={ProductFormScreen}
      />
    </InventoryStack.Navigator>
  );
}

function TransactionsStackScreen() {
  return (
    <TransactionsStack.Navigator screenOptions={{ headerShown: false }}>
      <TransactionsStack.Screen
        name="TransactionsMain"
        component={TransactionsScreen}
      />
      <TransactionsStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
      />
    </TransactionsStack.Navigator>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="POS"
        component={POSStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Receipt size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
