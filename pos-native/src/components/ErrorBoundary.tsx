import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center bg-white p-8">
          <View className="w-16 h-16 rounded-full bg-danger-50 items-center justify-center mb-4">
            <AlertTriangle size={32} color="#ef4444" />
          </View>
          <Text className="text-lg font-bold text-gray-900 mb-2">
            Something went wrong
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            className="flex-row items-center bg-primary-500 px-6 py-3 rounded-xl"
          >
            <RefreshCw size={18} color="white" />
            <Text className="text-white font-semibold ml-2">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
