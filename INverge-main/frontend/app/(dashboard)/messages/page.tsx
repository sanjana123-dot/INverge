'use client';

import { useEffect, useState, useRef } from 'react';
import { messageService } from '@/services/message.service';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import type { Message } from '@/types';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [conversations, setConversations] = useState<
    Array<{
      partner: { id: string; name: string; profilePicture: string | null };
      lastMessage: Message;
      unreadCount: number;
    }>
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [typing, setTyping] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingConversations(true);
    messageService
      .getConversations()
      .then(({ data }) => {
        setConversations(data.data ?? []);
      })
      .finally(() => setLoadingConversations(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMessages(true);
    messageService
      .getConversation(selectedId)
      .then(({ data }) => {
        setMessages(data.data?.messages ?? []);
      })
      .finally(() => setLoadingMessages(false));
  }, [selectedId]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    socket.on('message:new', (msg: Message) => {
      if (msg.senderId === selectedId || msg.receiverId === selectedId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('typing:start', ({ userId }: { userId: string }) => {
      if (userId === selectedId) setTyping(true);
    });
    socket.on('typing:stop', () => setTyping(false));

    return () => {
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [accessToken, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!selectedId || !content.trim() || !accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit('message:send', { receiverId: selectedId, content }, (err: Error | null, msg?: Message) => {
      if (!err && msg) {
        setMessages((prev) => [...prev, msg]);
        setContent('');
      }
    });
  };

  const handleTyping = () => {
    if (!selectedId || !accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit('typing:start', { receiverId: selectedId });
    setTimeout(() => socket.emit('typing:stop', { receiverId: selectedId }), 2000);
  };

  const selectedPartner = conversations.find((c) => c.partner.id === selectedId)?.partner;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-72 shrink-0 overflow-y-auto p-2">
        <h2 className="mb-3 px-2 font-semibold">Conversations</h2>
        {loadingConversations ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-2 text-sm text-zinc-500">No conversations yet. Accept a request first.</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.partner.id}
              onClick={() => setSelectedId(c.partner.id)}
              className={`mb-1 w-full rounded-lg p-3 text-left text-sm transition-colors ${
                selectedId === c.partner.id
                  ? 'bg-violet-50 dark:bg-violet-900/30'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <p className="font-medium">{c.partner.name}</p>
              <p className="truncate text-xs text-zinc-500">{c.lastMessage.content}</p>
              {c.unreadCount > 0 && (
                <span className="mt-1 inline-block rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
                  {c.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </Card>

      <Card className="flex flex-1 flex-col">
        {selectedId ? (
          <>
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <p className="font-semibold">{selectedPartner?.name}</p>
              {typing && <p className="text-xs text-zinc-500">typing...</p>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ?
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={`h-12 ${i % 2 ? 'ml-auto w-2/3' : 'w-2/3'}`} />
                ))
              : messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    m.senderId === user?.id
                      ? 'ml-auto bg-violet-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  <p>{m.content}</p>
                  <p className="mt-1 text-xs opacity-70">{formatDate(m.createdAt)}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
              <Input
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-zinc-500">
            Select a conversation
          </div>
        )}
      </Card>
    </div>
  );
}
