import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { apiFormData } from "../lib/api";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Sparkles, Upload, ImageIcon } from "lucide-react-native";

const ALLOWED_EXTENSIONS = ["txt", "md", "json", "csv"];

export default function CreateScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [relationship, setRelationship] = useState("");
  const [background, setBackground] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [impression, setImpression] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: DocumentPicker.types.plainFiles,
        multiple: true,
      });

      const filtered = result.filter((doc) => {
        const ext = doc.name?.split(".").pop()?.toLowerCase();
        return ext ? ALLOWED_EXTENSIONS.includes(ext) : false;
      });

      setFiles([...files, ...filtered]);
    } catch (e) {
      // User cancelled
    }
  };

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      Alert.alert("请填写人物昵称");
      return;
    }

    if (files.length === 0 && !pastedText.trim()) {
      Alert.alert("请上传文件或粘贴文本");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nickname", nickname);
      if (relationship) formData.append("relationship", relationship);
      if (background) formData.append("background", background);
      if (timeframe) formData.append("timeframe", timeframe);
      if (impression) formData.append("impression", impression);
      if (avatarUrl) formData.append("avatarUrl", avatarUrl);
      if (pastedText) formData.append("pastedText", pastedText);

      files.forEach((file, i) => {
        formData.append("files", {
          uri: file.uri,
          name: file.name,
          type: "text/plain",
        } as any);
      });

      const res = await apiFormData("/api/characters", formData);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "创建失败");
      }

      Alert.success("创建成功！");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-6">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <Sparkles size={20} color="white" />
          </View>
          <Text className="text-xl font-bold text-gray-900">创建角色</Text>
        </View>
      </View>

      <View className="px-6 py-4 space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            人物昵称 <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="例如：小明、姐姐"
            className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">与你的关系</Text>
          <TextInput
            value={relationship}
            onChangeText={setRelationship}
            placeholder="例如：朋友、前女友、同事"
            className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">相识背景</Text>
          <TextInput
            value={background}
            onChangeText={setBackground}
            placeholder="例如：大学同学、公司同事"
            className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">认识时间跨度</Text>
          <TextInput
            value={timeframe}
            onChangeText={setTimeframe}
            placeholder="例如：2年、半年"
            className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">你的头像</Text>
          <TouchableOpacity onPress={pickAvatar} className="flex-row items-center gap-2">
            <View className="h-16 w-16 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="h-full w-full" />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <ImageIcon size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
            <Text className="text-sm text-gray-500">点击更换头像</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">你的主观印象</Text>
          <TextInput
            value={impression}
            onChangeText={setImpression}
            placeholder="描述你对这个人的整体印象"
            multiline
            numberOfLines={3}
            className="h-24 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            聊天资料 <Text className="text-red-500">*</Text>
          </Text>
          <TouchableOpacity
            onPress={pickDocuments}
            className="h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50"
          >
            <Upload size={24} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 mt-2">点击上传文件</Text>
            <Text className="text-xs text-gray-400">支持 txt/md/json/csv</Text>
          </TouchableOpacity>

          {files.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {files.map((file, i) => (
                <View
                  key={i}
                  className="px-3 py-1 bg-indigo-50 rounded-full"
                >
                  <Text className="text-xs text-indigo-600">{file.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">或粘贴文本</Text>
          <TextInput
            value={pastedText}
            onChangeText={setPastedText}
            placeholder="粘贴聊天记录文本"
            multiline
            numberOfLines={6}
            className="h-32 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900"
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="h-14 items-center justify-center rounded-xl bg-indigo-600 mt-4"
        >
          <Text className="text-base font-semibold text-white">
            {loading ? "创建中..." : "创建角色"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}