import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { apiGet } from "../lib/api";
import type { Character } from "../lib/types";
import { Sparkles, Plus } from "lucide-react-native";
import { useAuthStore } from "../lib/auth";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const res = await apiGet("/api/characters");
      if (res.ok) {
        const data = await res.json();
        setCharacters(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Character }) => (
    <TouchableOpacity
      onPress={() => router.push(`/chat/${item.id}`)}
      className="flex-row items-center gap-4 p-4 bg-white rounded-2xl mb-3 border border-gray-100"
    >
      <View className="h-14 w-14 rounded-2xl bg-indigo-100 overflow-hidden">
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            className="h-full w-full"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-indigo-100">
            <Text className="text-xl font-bold text-indigo-600">
              {item.nickname[0]}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">
          {item.nickname}
        </Text>
        <Text className="text-sm text-gray-500">
          {item.relationship || "还未设置关系"}
        </Text>
      </View>
      <View className={`px-2 py-1 rounded-full ${
        item.analysisStatus === "DONE" ? "bg-green-100" :
        item.analysisStatus === "RUNNING" ? "bg-yellow-100" :
        item.analysisStatus === "FAILED" ? "bg-red-100" : "bg-gray-100"
      }`}>
        <Text className={`text-xs font-medium ${
          item.analysisStatus === "DONE" ? "text-green-600" :
          item.analysisStatus === "RUNNING" ? "text-yellow-600" :
          item.analysisStatus === "FAILED" ? "text-red-600" : "text-gray-600"
        }`}>
          {item.analysisStatus}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <Sparkles size={20} color="white" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-900">千人智聊</Text>
            <Text className="text-xs uppercase tracking-widest text-gray-400">
              你好，{user?.nickname || user?.email}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1 px-6 pt-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : characters.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 mb-4">
              <Sparkles size={36} color="#4F46E5" />
            </View>
            <Text className="text-lg font-bold text-gray-900 mb-2">
              暂无角色
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              创建第一个角色，开始灵魂对话
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/create")}
              className="flex-row items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl"
            >
              <Plus size={18} color="white" />
              <Text className="text-base font-semibold text-white">创建角色</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={characters}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </View>
  );
}