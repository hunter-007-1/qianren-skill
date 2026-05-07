import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiGet } from "../../lib/api";
import type { Character, AnalysisResult } from "../../lib/types";
import { ArrowLeft, Sparkles, MessageCircle, Info } from "lucide-react-native";

export default function AnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await apiGet(`/api/characters/${id}`);
      if (res.ok) {
        setCharacter(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!character) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  const analysis = character.analysis as any;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-4 py-4 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">
          {character.nickname} - 分析报告
        </Text>
      </View>

      <View className="p-4 space-y-4">
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={18} color="#4F46E5" />
            <Text className="text-base font-bold text-gray-900">人格摘要</Text>
          </View>
          {analysis?.persona?.summary ? (
            <Text className="text-sm text-gray-600 leading-relaxed">
              {analysis.persona.summary}
            </Text>
          ) : (
            <Text className="text-sm text-gray-400">暂无分析数据</Text>
          )}
        </View>

        {analysis?.persona?.traits?.length > 0 && (
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-base font-bold text-gray-900 mb-3">核心特质</Text>
            <View className="flex-row flex-wrap gap-2">
              {analysis.persona.traits.map((trait: string, i: number) => (
                <View key={i} className="px-3 py-1 bg-indigo-50 rounded-full">
                  <Text className="text-sm text-indigo-600">{trait}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {analysis?.speakingStyle && (
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-center gap-2 mb-3">
              <MessageCircle size={18} color="#4F46E5" />
              <Text className="text-base font-bold text-gray-900">说话风格</Text>
            </View>
            {analysis.speakingStyle.tone?.length > 0 && (
              <View className="mb-2">
                <Text className="text-sm text-gray-500 mb-1">语气</Text>
                <View className="flex-row flex-wrap gap-2">
                  {analysis.speakingStyle.tone.map((t: string, i: number) => (
                    <View key={i} className="px-3 py-1 bg-blue-50 rounded-full">
                      <Text className="text-sm text-blue-600">{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {analysis.speakingStyle.habits?.length > 0 && (
              <View>
                <Text className="text-sm text-gray-500 mb-1">习惯</Text>
                <View className="flex-row flex-wrap gap-2">
                  {analysis.speakingStyle.habits.map((h: string, i: number) => (
                    <View key={i} className="px-3 py-1 bg-green-50 rounded-full">
                      <Text className="text-sm text-green-600">{h}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {analysis?.emotionPattern && (
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-center gap-2 mb-3">
              <Info size={18} color="#4F46E5" />
              <Text className="text-base font-bold text-gray-900">情绪模式</Text>
            </View>
            <Text className="text-sm text-gray-600">
              调节方式：{analysis.emotionPattern.regulationStyle || "未知"}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push(`/chat/${id}`)}
          className="h-14 items-center justify-center rounded-xl bg-indigo-600 mt-4"
        >
          <Text className="text-base font-semibold text-white">开始对话</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}