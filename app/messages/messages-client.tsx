'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, ArrowLeft, User, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface UserInfo {
  id: string;
  name: string | null;
  image: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: UserInfo;
}

interface Conversation {
  otherUser: UserInfo;
  lastMessage: Message;
  unreadCount: number;
}

export function MessagesClient() {
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialUserId = searchParams?.get('user');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Konuşmaları yükle
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Conversations fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mesajları yükle
  const fetchMessages = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/messages/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.otherUser);
        setMessages(data.messages);
        // Konuşmaları güncelle (okunmamış sayısını sıfırla)
        setConversations(prev => prev.map(c => 
          c.otherUser.id === userId ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Messages fetch error:', error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchConversations();
  }, [fetchConversations]);

  // URL'den user parametresi varsa o konuşmayı aç
  useEffect(() => {
    if (initialUserId && mounted) {
      fetchMessages(initialUserId);
    }
  }, [initialUserId, mounted, fetchMessages]);

  // Mesajların sonuna scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mesaj gönder
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: newMessage.trim()
        })
      });

      if (res.ok) {
        const message = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        // Konuşma listesini güncelle
        fetchConversations();
      } else {
        const data = await res.json();
        toast({
          title: 'Hata',
          description: data.error || 'Mesaj gönderilemedi',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Mesaj gönderilemedi',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  // Konuşma seç
  const selectConversation = (user: UserInfo) => {
    setSelectedUser(user);
    fetchMessages(user.id);
  };

  // Filtrelenmiş konuşmalar
  const filteredConversations = conversations.filter(c =>
    c.otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mesajlar</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Sol: Konuşma Listesi */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Konuşma ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Henüz konuşmanız yok</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Pet sahipleriyle mesajlaşmaya başlayın!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.otherUser.id}
                        onClick={() => selectConversation(conv.otherUser)}
                        className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedUser?.id === conv.otherUser.id ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={conv.otherUser.image || undefined} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">
                                {conv.otherUser.name || 'Anonim'}
                              </span>
                              {conv.unreadCount > 0 && (
                                <Badge className="bg-orange-500 hover:bg-orange-600">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {conv.lastMessage.senderId === session?.user?.id ? 'Siz: ' : ''}
                              {conv.lastMessage.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                                addSuffix: true,
                                locale: tr
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Sağ: Mesaj Alanı */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedUser ? (
              <>
                {/* Sohbet Başlığı */}
                <CardHeader className="border-b py-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedUser(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                      <AvatarImage src={selectedUser.image || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedUser.name || 'Anonim'}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                {/* Mesajlar */}
                <CardContent className="flex-1 p-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((message) => {
                          const isOwn = message.senderId === session?.user?.id;
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-orange-500 text-white rounded-br-md'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                                }`}
                              >
                                <p className="break-words">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn ? 'text-orange-100' : 'text-gray-400'
                                  }`}
                                >
                                  {formatDistanceToNow(new Date(message.createdAt), {
                                    addSuffix: true,
                                    locale: tr
                                  })}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Mesaj Gönderme */}
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                    Bir konuşma seçin
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Sol taraftan bir konuşma seçerek mesajlaşmaya başlayın
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
