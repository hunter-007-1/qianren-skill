import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessage } from "@/lib/types";

/**
 * 聊天功能 Hook
 */
export function useChat(characterId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 加载历史消息
  const loadMessages = useCallback(async () => {
    if (!characterId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/chat/${characterId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Load messages error:", error);
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  // 发送消息
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!content.trim() || sending) return false;

    setSending(true);
    
    try {
      const response = await fetch(`/api/chat/${characterId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const payload = await response.json();
      
      if (!response.ok) {
        throw new Error(payload.error ?? "发送失败");
      }

      setMessages((prev) => [...prev, payload.user, payload.assistant]);
      return true;
    } catch (error) {
      console.error("Send message error:", error);
      return false;
    } finally {
      setSending(false);
    }
  }, [characterId, sending]);

  // 清空会话
  const clearMessages = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`/api/chat/${characterId}`, { 
        method: "DELETE" 
      });
      
      if (!response.ok) throw new Error("清空失败");
      
      setMessages([]);
      return true;
    } catch (error) {
      console.error("Clear messages error:", error);
      return false;
    }
  }, [characterId]);

  // 重新生成回复
  const regenerateMessage = useCallback(async (): Promise<boolean> => {
    if (messages.length === 0 || sending) return false;
    
    setSending(true);
    
    try {
      const response = await fetch(`/api/chat/${characterId}/regenerate`, {
        method: "POST",
      });
      
      const payload = await response.json();
      
      if (!response.ok) {
        throw new Error(payload.error ?? "重新生成失败");
      }

      setMessages((prev) => [...prev.slice(0, -1), payload]);
      return true;
    } catch (error) {
      console.error("Regenerate error:", error);
      return false;
    } finally {
      setSending(false);
    }
  }, [characterId, messages.length, sending]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    clearMessages,
    regenerateMessage,
    messagesEndRef,
  };
}