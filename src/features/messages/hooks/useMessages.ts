import { useState, useEffect } from 'react';
import { mockConversations } from '../../../data/messages';

export function useMessages() {
  const [conversations, setConversations] = useState(mockConversations);
  
  const unreadCount = conversations.reduce((total, conversation) => {
    const msgs = Array.isArray(conversation?.messages) ? conversation.messages : [];
    return total + msgs.filter((m) => m?.senderId !== 'you' && !m?.read).length;
  }, 0);

  return {
    conversations,
    unreadCount,
    setConversations,
  };
}