import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { apiGet } from "../lib/api";
import { Sparkles, Users, Trash2 } from "lucide-react-native";

interface UserData {
  id: string;
  email: string;
  nickname: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: { characters: number };
}

interface CharacterData {
  id: string;
  nickname: string;
  analysisStatus: string;
  user: { email: string } | null;
}

export default function AdminScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "characters">("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (tab === "users") {
        const res = await apiGet("/api/admin/users");
        if (res.ok) setUsers(await res.json());
      } else {
        const res = await apiGet("/api/admin/characters");
        if (res.ok) setCharacters(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("确定删除？")) return;
    try {
      await apiDelete(`/api/characters/${id}`);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const renderUser = ({ item }: { item: UserData }) => (
    <View className="flex-row items-center justify-between p-4 bg-white rounded-2xl mb-2 border border-gray-100">
      <View>
        <Text className="text-base font-semibold text-gray-900">
          {item.nickname || item.email}
        </Text>
        <Text className="text-sm text-gray-500">{item.email}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-gray-400">
          {item._count.characters} 个角色
        </Text>
        {item.isAdmin && (
          <View className="px-2 py-1 bg-red-100 rounded-full">
            <Text className="text-xs text-red-600">管理员</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCharacter = ({ item }: { item: CharacterData }) => (
    <View className="flex-row items-center justify-between p-4 bg-white rounded-2xl mb-2 border border-gray-100">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <Sparkles size={18} color="#4F46E5" />
        </View>
        <View>
          <Text className="text-base font-semibold text-gray-900">
            {item.nickname}
          </Text>
          <Text className="text-sm text-gray-500">
            所有者：{item.user?.email || "未知"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteCharacter(item.id)}
        className="p-2"
      >
        <Trash2 size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-12 pb-4">
        <Text className="text-xl font-bold text-gray-900">管理员面板</Text>
      </View>

      <View className="flex-row border-b border-gray-200 bg-white px-4">
        <TouchableOpacity
          onPress={() => setTab("users")}
          className={`px-4 py-3 ${
            tab === "users" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"
          }`}
        >
          <Text className="text-sm font-medium">用户管理</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("characters")}
          className={`px-4 py-3 ${
            tab === "characters" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"
          }`}
        >
          <Text className="text-sm font-medium">全部角色</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 pt-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : tab === "users" ? (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <FlatList
            data={characters}
            renderItem={renderCharacter}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
    </View>
  );
}