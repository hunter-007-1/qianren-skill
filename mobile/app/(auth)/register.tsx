import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../lib/auth";
import { Sparkles } from "lucide-react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("请输入邮箱和密码");
      return;
    }

    if (password.length < 6) {
      Alert.alert("密码至少需要6位");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, nickname || undefined);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(error instanceof Error ? error.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-20">
      <View className="flex-row items-center gap-3 mb-8">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600">
          <Sparkles size={28} color="white" />
        </View>
        <View>
          <Text className="text-2xl font-bold text-gray-900">注册</Text>
          <Text className="text-xs uppercase tracking-widest text-gray-400">Qianren Skill</Text>
        </View>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">昵称（可选）</Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="请输入昵称"
            className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">邮箱</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="请输入邮箱"
            keyboardType="email-address"
            autoCapitalize="none"
            className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">密码</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="请输入密码（至少6位）"
            secureTextEntry
            className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          className="h-12 items-center justify-center rounded-xl bg-indigo-600 mt-4"
        >
          <Text className="text-base font-semibold text-white">
            {loading ? "注册中..." : "注册"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="h-12 items-center justify-center rounded-xl border border-gray-200 mt-2"
        >
          <Text className="text-base font-medium text-gray-600">
            已有账号？去登录
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}