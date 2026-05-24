'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Send, Globe, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getSocket, connectSocket } from '@/lib/socket';
import api from '@/lib/api';

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Chinese' }, { code: 'hi', name: 'Hindi' },
  { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' }, { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' }, { code: 'ko', name: 'Korean' },
];

export default function MessagesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeConv, setActiveConv] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [prefLang, setPrefLang] = useState('en');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then(r => r.data),
  });

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(user.id);
    socket.on('new_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    });
    return () => { socket.off('new_message'); };
  }, [user, qc]);

  const loadMessages = async (conv: any) => {
    setActiveConv(conv);
    const socket = getSocket();
    socket.emit('join_room', { conversationId: conv.id });
    const res = await api.get(`/messages/conversations/${conv.id}/messages`);
    setMessages(res.data.reverse());
    await api.post(`/messages/conversations/${conv.id}/read`);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = () => {
    if (!message.trim() || !activeConv || !user) return;
    const socket = getSocket();
    socket.emit('send_message', {
      conversationId: activeConv.id,
      content: message,
      senderId: user.id,
      type: 'TEXT',
    });
    setMessage('');
  };

  const getConvName = (conv: any) => {
    if (conv.type === 'GROUP') return conv.name;
    const other = conv.participants?.find((p: any) => p.userId !== user?.id);
    return other?.user?.profile?.name || other?.user?.username || 'Unknown';
  };

  const getDisplayMessage = (msg: any) => {
    if (msg.senderId === user?.id) return msg.content;
    const translations = msg.translations as Record<string, string> | null;
    return translations?.[prefLang] || msg.content;
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden -mx-4 -my-6">
      {/* Conversations list */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-lg mb-3">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 border-0 outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.filter((c: any) => getConvName(c).toLowerCase().includes(search.toLowerCase())).map((conv: any) => {
            const lastMsg = conv.messages?.[0];
            const name = getConvName(conv);
            return (
              <button key={conv.id} onClick={() => loadMessages(conv)} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors ${activeConv?.id === conv.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm truncate">{name}</p>
                    {lastMsg && <span className="text-xs text-gray-400 shrink-0 ml-2">{formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}</span>}
                  </div>
                  {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content}</p>}
                </div>
              </button>
            );
          })}
          {conversations.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No conversations yet</div>
          )}
        </div>
      </div>

      {/* Chat window */}
      {activeConv ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#8B0000] flex items-center justify-center text-white text-sm font-bold">
                {getConvName(activeConv)[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{getConvName(activeConv)}</p>
                <p className="text-xs text-green-500">Active</p>
              </div>
            </div>
            {/* Language selector */}
            <div className="flex items-center gap-2 text-sm">
              <Globe size={14} className="text-[#8B0000]" />
              <select value={prefLang} onChange={e => { setPrefLang(e.target.value); api.patch(`/messages/conversations/${activeConv.id}/language`, { language: e.target.value }); }} className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 outline-none">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg: any) => {
              const isMe = msg.senderId === user?.id;
              const displayed = getDisplayMessage(msg);
              const isTranslated = !isMe && msg.translations?.[prefLang] && msg.translations[prefLang] !== msg.content;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-[#8B0000] text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'}`}>
                      {displayed}
                      {isTranslated && (
                        <div className="mt-1 pt-1 border-t border-white border-opacity-20 text-xs opacity-70">
                          Original: {msg.content}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message... (auto-translated for recipients)"
              className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm outline-none border-0"
            />
            <button onClick={sendMessage} disabled={!message.trim()} className="w-10 h-10 bg-[#8B0000] text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-[#6b0000] transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-5xl mb-4">💬</div>
            <p className="font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Messages auto-translate for all participants</p>
          </div>
        </div>
      )}
    </div>
  );
}
