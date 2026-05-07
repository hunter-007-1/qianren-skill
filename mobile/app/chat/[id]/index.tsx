import { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiGet, apiPost, apiDelete } from "../../lib/api";
import type { Character, ChatMessage } from "../../lib/types";
import { useAuthStore } from "../../lib/auth";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [charRes, msgRes] = await Promise.all([
        apiGet(`/api/characters/${id}`),
        apiGet(`/api/chat/${id}`),
      ]);

      if (!charRes.ok) {
        router.back();
        return;
      }

      setCharacter(await charRes.json());

      if (msgRes.ok) {
        setMessages(await msgRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;

    const optimisticUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setInput("");
    setSending(true);
    setTyping(true);
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await apiPost(`/api/chat/${id}`, { content });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "发送失败");
      }

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticUser.id);
        return [...filtered, data.user, data.assistant];
      });
      setTyping(false);
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(content);
      setTyping(false);
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    Alert.alert("确定清空对话？", "", [
      { text: "取消", style: "cancel" },
      { text: "确定", style: "destructive", onPress: async () => {
        try {
          await apiDelete(`/api/chat/${id}`);
          setMessages([]);
        } catch (e) {
          console.error(e);
        }
      }},
    ]);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      className={`flex-row mb-4 ${item.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`flex-row max-w-[80%] items-end gap-2 ${
          item.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        <View className="h-10 w-10 rounded-2xl overflow-hidden bg-gray-100">
          {item.role === "user" ? (
            character?.userAvatarUrl ? (
              <Image
                source={{ uri: character.userAvatarUrl! }}
                className="h-full w-full"
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-blue-600">
                <Text className="text-white font-bold">U</Text>
              </View>
            )
          ) : character?.avatarUrl ? (
            <Image
              source={{ uri: character.avatarUrl }}
              className="h-full w-full"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-gray-900">
              <Text className="text-white font-bold">
                {character?.nickname[0] || "?"}
              </Text>
            </View>
          )}
        </View>
        <View
          className={`px-4 py-3 rounded-2xl ${
            item.role === "user"
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-gray-100 text-gray-800 rounded-bl-none"
          }`}
        >
          <Text className={item.role === "user" ? "text-white" : "text-gray-800"}>
            {item.content}
          </Text>
        </View>
      </View>
    </View>
  );

  if (!character) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
            {character.nickname}
          </Text>
          <Text className="text-xs text-emerald-500">在线</Text>
        </View>
        <TouchableOpacity onPress={clearChat} className="p-2">
          <Trash2 size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {typing && (
        <View className="flex-row items-center gap-2 px-4 py-3">
          <View className="h-8 w-8 rounded-full bg-gray-100 items-center justify-center">
            <Text className="text-xs font-bold text-gray-500">
              {character.nickname[0]}
            </Text>
          </View>
          <View className="flex-row items-center gap-1 px-4 py-2 bg-gray-100 rounded-full">
            <View className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
            <View className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <View className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </View>
        </View>
      )}

      <View className="flex-row items-center gap-2 px-4 py-4 border-t border-gray-100">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`与 ${character.nickname} 对话...`}
          className="flex-1 h-12 px-4 rounded-full border border-gray-200 bg-gray-50"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={sending || !input.trim()}
          className="h-12 w-12 items-center justify-center rounded-full bg-indigo-600 disabled:opacity-50"
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}