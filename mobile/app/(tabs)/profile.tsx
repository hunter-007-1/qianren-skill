import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../lib/auth";
import { LogOut, Shield, Sparkles } from "lucide-react-native";
import { useAuthStore as useAdminAuth } from "../lib/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("确定退出登录？", "", [
      { text: "取消", style: "cancel" },
      {
        text: "退出",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-6">
        <Text className="text-xl font-bold text-gray-900">个人中心</Text>
      </View>

      <View className="px-6 py-4 space-y-4">
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
              <Sparkles size={24} color="#4F46E5" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-gray-900">
                {user?.nickname || user?.email}
              </Text>
              <Text className="text-sm text-gray-500">{user?.email}</Text>
            </View>
          </View>

          {user?.isAdmin && (
            <View className="flex-row items-center gap-2 mt-3 px-3 py-2 bg-red-50 rounded-xl">
              <Shield size={14} color="#DC2626" />
              <Text className="text-xs font-medium text-red-600">管理员</Text>
            </View>
          )}
        </View>

        {user?.isAdmin && (
          <TouchableOpacity
            onPress={() => router.push("/admin")}
            className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center gap-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <Shield size={18} color="#DC2626" />
            </View>
            <Text className="text-base font-medium text-gray-900 flex-1">
              管理员面板
            </Text>
            <Text className="text-gray-400">{">"}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center gap-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <LogOut size={18} color="#DC2626" />
          </View>
          <Text className="text-base font-medium text-red-600 flex-1">
            退出登录
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}