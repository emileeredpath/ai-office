import { useState, useEffect } from 'react';
import * as api from '@/services/api';

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_emoji: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface Conversation {
  id: string;
  title?: string;
  status: string;
  ai_employee_id: string;
  ai_name: string;
  ai_emoji: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export function useConversations(
  companyId: string,
  filters?: { userId?: string; aiEmployeeId?: string }
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const data = await api.getConversations(companyId, filters);
        setConversations(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [companyId, filters?.userId, filters?.aiEmployeeId]);

  return { conversations, loading, error };
}

export function useConversation(id: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchConversation = async () => {
      try {
        setLoading(true);
        const data = await api.getConversation(id);
        setConversation(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [id]);

  const sendMessage = async (senderId: string, content: string) => {
    try {
      const message = await api.sendMessage(id, senderId, content);
      setConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...(prev.messages || []), message],
          updated_at: new Date().toISOString(),
        };
      });
      return message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  return { conversation, loading, error, sendMessage };
}
