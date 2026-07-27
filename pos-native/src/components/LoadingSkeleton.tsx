import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({
  className = '',
  width,
  height = 20,
  borderRadius = 8,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity.current, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity.current, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={{ opacity: opacity.current, width: width as any, height, borderRadius }}
      className={`bg-gray-200 ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View className="flex-row items-center bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
      <Skeleton width={56} height={56} borderRadius={12} />
      <View className="flex-1 ml-3 gap-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
        <Skeleton width="30%" height={12} />
      </View>
      <Skeleton width={60} height={24} borderRadius={8} />
    </View>
  );
}

export function CartItemSkeleton() {
  return (
    <View className="flex-row items-center bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
      <Skeleton width={48} height={48} borderRadius={8} />
      <View className="flex-1 ml-3 gap-1.5">
        <Skeleton width="50%" height={14} />
        <Skeleton width="30%" height={12} />
      </View>
      <View className="flex-row items-center gap-2">
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width={24} height={16} />
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 mb-2 shadow-sm border border-gray-100">
      <View className="flex-row justify-between mb-3">
        <Skeleton width={80} height={14} />
        <Skeleton width={120} height={14} />
      </View>
      <View className="flex-row justify-between items-center">
        <Skeleton width={100} height={20} />
        <Skeleton width={60} height={18} borderRadius={6} />
      </View>
    </View>
  );
}
