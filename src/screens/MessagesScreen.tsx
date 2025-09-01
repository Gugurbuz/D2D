// src/screens/MessagesScreen.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MessageSquare, Search, Send } from 'lucide-react';
import { mockConversations, Conversation } from '../data/messages';
import { teamReps, TeamRep } from '../data/team';

// Tarih ve saat formatlama için yardımcı fonksiyon
const formatMessageTime = (isoString: string) => {
  const date = new Date(isoString);
  // Bugünün tarihini al (saat olmadan)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Mesaj tarihini al (saat olmadan)
  const messageDate = new Date(isoString);
  messageDate.setHours(0, 0, 0, 0);

  if (today.getTime() === messageDate.getTime()) {
    // Mesaj bugün gönderildiyse sadece saat göster
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } else {
    // Farklı bir gün ise tam tarih göster
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};


const MessagesScreen = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedRepId, setSelectedRepId] = useState<string | null>('rep-1'); // Başlangıçta ilk kişi seçili olsun
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Rep verilerini kolay erişim için bir haritaya dönüştürelim
  const repsMap = useMemo(() => 
    new Map(teamReps.map(rep => [rep.id, rep])), 
    []
  );

  const selectedConversation = useMemo(() => 
    conversations.find(c => c.participantB === selectedRepId), 
    [conversations, selectedRepId]
  );
  
  // Mesajlar görüntülendiğinde en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);


  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-xl border border-gray-200">
      {/* Sol Taraf: Konuşma Listesi */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Mesajlar</h2>
        </div>
        <div className="flex-grow overflow-auto">
          {conversations.map(convo => {
            const rep = repsMap.get(convo.participantB);
            if (!rep) return null;

            const lastMessage = convo.messages[convo.messages.length - 1];
            const unreadCount = convo.messages.filter(m => !m.read && m.senderId !== 'you').length;

            return (
              <div
                key={rep.id}
                onClick={() => setSelectedRepId(rep.id)}
                className={`p-4 flex items-center gap-3 cursor-pointer border-l-4 transition-colors ${
                  selectedRepId === rep.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <img src={`https://ui-avatars.com/api/?name=${rep.name.replace(' ', '+')}&background=${rep.color.substring(1)}&color=fff`} className="w-12 h-12 rounded-full" alt={rep.name} />
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-900 truncate">{rep.name}</p>
                    {lastMessage && <p className="text-xs text-gray-500 flex-shrink-0">{formatMessageTime(lastMessage.timestamp)}</p>}
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500 truncate">{lastMessage?.text ?? "Henüz mesaj yok"}</p>
                    {unreadCount > 0 && (
                      <span className="ml-2 mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full flex-shrink-0">{unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sağ Taraf: Mesajlaşma Alanı */}
      <div className="w-2/3 flex flex-col">
        {selectedConversation && repsMap.has(selectedRepId!) ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <img src={`https://ui-avatars.com/api/?name=${repsMap.get(selectedRepId!)!.name.replace(' ', '+')}&background=${repsMap.get(selectedRepId!)!.color.substring(1)}&color=fff`} className="w-10 h-10 rounded-full" alt={repsMap.get(selectedRepId!)!.name} />
              <h3 className="font-semibold text-lg text-gray-800">{repsMap.get(selectedRepId!)!.name}</h3>
            </div>
            <div className="flex-grow p-6 overflow-auto bg-gray-50">
              <div className="space-y-4">
                {selectedConversation.messages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === 'you' ? 'justify-end' : 'justify-start'}`}>
                    {msg.senderId !== 'you' && <img src={`https://ui-avatars.com/api/?name=${repsMap.get(msg.senderId)!.name.replace(' ', '+')}&background=${repsMap.get(msg.senderId)!.color.substring(1)}&color=fff`} className="w-8 h-8 rounded-full" alt={repsMap.get(msg.senderId)!.name} />}
                    <div className={`max-w-md p-3 rounded-2xl ${msg.senderId === 'you' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'}`}>
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === 'you' ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                        {formatMessageTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 border-t bg-white">
              <div className="relative">
                <input type="text" placeholder="Bir mesaj yazın..." className="w-full pr-12 pl-4 py-3 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600">
                  <Send className="w-5 h-5"/>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-300" />
                <p className="mt-2">Görüntülemek için bir konuşma seçin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesScreen;