'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Check,
  CheckCheck,
  PawPrint,
  MessageCircle,
  Heart,
  Trophy,
  AlertCircle,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

export default function NotificationsClient() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?page=${page}&limit=15`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setTotalPages(data.totalPages || 1);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast({
          title: 'Başarılı',
          description: 'Tüm bildirimler okundu olarak işaretlendi',
        });
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Tüm bildirimler silinecek. Emin misiniz?')) return;
    
    try {
      const response = await fetch('/api/notifications/clear', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast({
          title: 'Başarılı',
          description: 'Tüm bildirimler temizlendi',
        });
      }
    } catch (error) {
      console.error('Clear notifications error:', error);
      toast({
        title: 'Hata',
        description: 'Bildirimler temizlenirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pet_approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'pet_comment':
      case 'story_comment':
      case 'listing_comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'pet_likes_milestone':
      case 'story_likes_milestone':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'competition_result':
      case 'competition_entry':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'message':
      case 'new_message':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'match_request':
      case 'match_accepted':
      case 'match_rejected':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'donation':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'daily_streak':
        return <Trophy className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'pet_approved':
      case 'pet_comment':
      case 'pet_likes_milestone':
        return notification.relatedId ? `/pets/${notification.relatedId}` : null;
      case 'story_comment':
      case 'story_likes_milestone':
        return notification.relatedId ? `/stories/${notification.relatedId}` : null;
      case 'competition_result':
      case 'competition_entry':
        return notification.relatedId ? `/competitions/${notification.relatedId}` : null;
      case 'message':
      case 'new_message':
        return '/messages';
      case 'listing_comment':
        return notification.relatedId ? `/listings/${notification.relatedId}` : null;
      case 'match_request':
      case 'match_accepted':
      case 'match_rejected':
        return '/matching';
      case 'donation':
        return '/donations';
      case 'daily_streak':
        return '/points';
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    const link = getNotificationLink(notification);
    if (link) {
      router.push(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <PawPrint className="w-12 h-12 animate-bounce text-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Bell className="w-8 h-8 text-purple-500" />
              Bildirimler
            </h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 mt-1">
                {unreadCount} okunmamış bildirim
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Tümünü Okundu İşaretle
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="destructive" onClick={clearAllNotifications}>
                <Trash2 className="w-4 h-4 mr-2" />
                Tümünü Temizle
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Bildirim yok
              </h3>
              <p className="text-gray-500">
                Yeni bildirimler burada görünecek
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? 'bg-purple-50 border-purple-200' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          !notification.isRead ? 'bg-purple-100' : 'bg-gray-100'
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-semibold ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <Badge variant="default" className="text-xs">
                              Yeni
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </p>
                      </div>
                      {getNotificationLink(notification) && (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Önceki
                </Button>
                <span className="flex items-center px-4">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
