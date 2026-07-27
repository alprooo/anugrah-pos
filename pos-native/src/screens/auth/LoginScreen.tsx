import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LogIn, Package } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo & Title */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-2xl bg-primary-500 items-center justify-center mb-4 shadow-lg shadow-primary-200">
            <Package size={40} color="white" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            Precision POS
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            Sign in to continue
          </Text>
        </View>

        {/* Error message */}
        {error && (
          <View className="bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-danger-700 text-sm">{error}</Text>
          </View>
        )}

        {/* Form */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">
              Email
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">
              Password
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`flex-row items-center justify-center rounded-xl py-3.5 ${
              isLoading ? 'bg-primary-400' : 'bg-primary-500'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <LogIn size={18} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Sign In
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
