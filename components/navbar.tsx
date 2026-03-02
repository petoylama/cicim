'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  PawPrint,
  Bell,
  User,
  LogOut,
  Settings,
  Award,
  Coins,
  MessageCircle,
  Menu,
  Home,
  Camera,
  Trophy,
  Search,
  Heart,
  Gift,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      // Bildirim sayısı
      fetch('/api/notifications/count')
        .then(res => res?.json())
        .then(data => setUnreadCount(data?.count ?? 0))
        .catch(() => {});
      // Okunmamış mesaj sayısı
      fetch('/api/messages/unread')
        .then(res => res?.json())
        .then(data => setUnreadMessages(data?.count ?? 0))
        .catch(() => {});
    }
  }, [session?.user?.id]);

  const navItems = [
    { href: '/dashboard', label: 'Ana Sayfa', icon: Home },
    { href: '/stories', label: 'Hikayeler', icon: Camera },
    { href: '/competitions', label: 'Yarışmalar', icon: Trophy },
    { href: '/listings', label: 'İlanlar', icon: Search },
    { href: '/matching', label: 'Eş Bul', icon: Heart },
    { href: '/donations', label: 'Bağış', icon: Gift },
    { href: '/messages', label: 'Mesajlar', icon: MessageCircle },
    { href: '/spin', label: 'CiciŞans', icon: Sparkles },
    { href: '/pazar', label: 'CiciPazar', icon: ShoppingBag },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image loading="eager" src="/logo.png" alt="CiciPet" width={40} height={40} className="rounded-lg" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-cici-600">CiciPet</span>
            <span className="text-[10px] text-cici-500 -mt-1 hidden sm:block">Sevgiyi Hisset</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems?.map?.((item) => (
            <Link
              key={item?.href}
              href={item?.href ?? '#'}
              className={`text-sm font-medium transition-colors hover:text-cici-500 ${
                pathname === item?.href ? 'text-cici-600' : 'text-gray-600'
              }`}
            >
              {item?.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Points - Hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-cici-100 px-3 py-1">
            <Coins className="h-4 w-4 text-cici-600" />
            <span className="text-sm font-semibold text-cici-700">{session?.user?.points ?? 0} CiciPuan</span>
          </div>

          {/* Messages */}
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="relative">
              <MessageCircle className="h-5 w-5" />
              {(unreadMessages ?? 0) > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs bg-green-500">
                  {unreadMessages}
                </Badge>
              )}
            </Button>
          </Link>

          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {(unreadCount ?? 0) > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User Menu - Desktop */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? 'User'} />
                    <AvatarFallback>{session?.user?.name?.charAt(0) ?? 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/points" className="cursor-pointer">
                    <Award className="mr-2 h-4 w-4" />
                    Puan Geçmişi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Ayarlar
                  </Link>
                </DropdownMenuItem>
                {session?.user?.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer text-orange-600">
                        <Award className="mr-2 h-4 w-4" />
                        Admin Paneli
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <PawPrint className="h-6 w-6 text-orange-500" />
                  <span className="text-orange-600">CiciPet</span>
                </SheetTitle>
              </SheetHeader>
              
              {/* User Info */}
              <div className="p-4 border-b bg-orange-50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? 'User'} />
                    <AvatarFallback>{session?.user?.name?.charAt(0) ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{session?.user?.name}</p>
                    <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-3 py-1 w-fit">
                  <Coins className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">{session?.user?.points ?? 0} CiciPuan</span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="p-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-orange-100 text-orange-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.href === '/messages' && unreadMessages > 0 && (
                        <Badge className="ml-auto bg-green-500">{unreadMessages}</Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-5 w-5" />
                    <span>Profil</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Ayarlar</span>
                  </Link>
                  {session?.user?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg text-orange-600 hover:bg-orange-50"
                    >
                      <Award className="h-5 w-5" />
                      <span>Admin Paneli</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
