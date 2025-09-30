import React from 'react';

interface Conversation {
  id: string;
  title?: string;
  userId?: string;
  participantA: string;
  participantB: string;
  updatedAt?: string;
  messages: any[];
}

interface MessageDropdownProps {
  isOpen: boolean;
  conversations: Conversation[];
  onClose: () => void;
  onNavigateToMessages: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

const MessageDropdown: React.FC<MessageDropdownProps> = ({
  isOpen,
  conversations,
  onClose,
  onNavigateToMessages,
  menuRef,
}) => {
  if (!isOpen) return null;

  const unreadCount = conversations.reduce((total, conversation) => {
    const msgs = Array.isArray(conversation?.messages) ? conversation.messages : [];
    return total + msgs.filter((m) => m?.senderId !== 'you' && !m?.read).length;
  }, 0);

  return (
    <div
      ref={menuRef}
      className="fixed right-16 top-20 z-[9999] w-[360px] max-w-[92vw] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg animate-fade-in-down"
    >
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-gray-100">Mesajlar</div>
          <div className="text-xs text-gray-500">
            {unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tümü okundu'}
          </div>
        </div>
      </div>

      <div className="max-h-[360px] overflow-auto divide-y">
        {conversations.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">Mesaj yok</div>
        ) : (
          conversations.map((conv) => {
            const lastMsg = [...(conv.messages || [])].pop();
            const unread = (conv.messages || []).some(
              (m) => m.senderId !== 'you' && !m.read
            );

            return (
              <button
                key={conv.id}
                onClick={() => {
                  onNavigateToMessages();
                  onClose();
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  unread ? 'bg-[#002D72]/5 dark:bg-[#F9C800]/10' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 ring-2 ring-white">
                    <div className="w-full h-full grid place-items-center text-gray-700 font-semibold">
                      {(conv.title || 'K').slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {conv.title || 'Konuşma'}
                      </div>
                      {unread && (
                        <span className="ml-auto inline-block w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    {lastMsg && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {lastMsg.senderId === 'you' ? 'Siz: ' : ''}
                        {lastMsg.text}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {conv.updatedAt || ''}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MessageDropdown;