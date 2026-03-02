'use client';

import { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ReCaptcha } from '@/components/recaptcha';
import { Heart, PawPrint, Sparkles, Trophy, Users } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginCaptchaToken, setLoginCaptchaToken] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupCaptchaToken, setSignupCaptchaToken] = useState('');

  // Captcha callbacks
  const handleLoginCaptchaVerify = useCallback((token: string) => {
    setLoginCaptchaToken(token);
  }, []);

  const handleSignupCaptchaVerify = useCallback((token: string) => {
    setSignupCaptchaToken(token);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setLoginCaptchaToken('');
    setSignupCaptchaToken('');
  }, []);

  // Redirect if authenticated
  if (status === 'authenticated' && session?.user) {
    redirect('/dashboard');
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginCaptchaToken) {
      toast({
        title: 'Hata',
        description: 'Lütfen "Ben robot değilim" kutusunu işaretleyin',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Önce captcha doğrula
      const captchaResponse = await fetch('/api/recaptcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: loginCaptchaToken }),
      });

      if (!captchaResponse.ok) {
        throw new Error('Captcha doğrulaması başarısız');
      }

      const result = await signIn('credentials', {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
      });

      if (result?.error) {
        toast({
          title: 'Hata',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error?.message ?? 'Giriş başarısız',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupCaptchaToken) {
      toast({
        title: 'Hata',
        description: 'Lütfen "Ben robot değilim" kutusunu işaretleyin',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Önce captcha doğrula
      const captchaResponse = await fetch('/api/recaptcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: signupCaptchaToken }),
      });

      if (!captchaResponse.ok) {
        throw new Error('Captcha doğrulaması başarısız');
      }

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? 'Kayıt başarısız');
      }

      toast({
        title: 'Başarılı!',
        description: 'Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.',
      });

      // Auto login after signup
      await signIn('credentials', {
        redirect: false,
        email: signupEmail,
        password: signupPassword,
      });

      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error?.message ?? 'Kayıt başarısız',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { redirect: true, callbackUrl: '/dashboard' });
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cici-50 via-cyan-50 to-sky-100">
        <div className="text-center">
          <div className="relative mx-auto h-20 w-20 animate-pulse">
            <Image loading="eager" src="/logo.png" alt="CiciPet" fill className="object-contain" />
          </div>
          <p className="mt-4 text-lg text-cici-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cici-50 via-cyan-50 to-sky-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-cici-200 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-pink-200 rounded-full blur-3xl opacity-40" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-200 rounded-full blur-2xl opacity-30" />
      
      {/* Header */}
      <header className="border-b border-cici-100 bg-white/70 backdrop-blur-md relative z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image loading="eager" src="/logo.png" alt="CiciPet" fill className="object-contain" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cici-600 to-cyan-600 bg-clip-text text-transparent">CiciPet</span>
              <p className="text-xs text-cici-500 -mt-1">Sevgiyi Hisset</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12 relative z-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Left: Info */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-cici-100 text-cici-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Türkiye'nin Pet Sosyal Ağı
            </div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
              Pet Severlerin{' '}
              <span className="bg-gradient-to-r from-cici-500 to-cyan-500 bg-clip-text text-transparent">
                Buluşma
              </span>{' '}
              Noktası
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
              Patili dostlarınızı paylaşın, hikayeler yazın, yarışmalara katılın ve CiciPuan kazanın!
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Eş Bul</p>
                  <p className="text-xs text-gray-500">Patili için eş ara</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-cici-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-cici-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Yarış</p>
                  <p className="text-xs text-gray-500">Puan kazan</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Topluluk</p>
                  <p className="text-xs text-gray-500">Pet severlerle buluş</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <PawPrint className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Sahiplen</p>
                  <p className="text-xs text-gray-500">Yuva arayan petler</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Auth Forms */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-md">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="relative h-16 w-16">
                  <Image loading="eager" src="/logo.png" alt="CiciPet" fill className="object-contain" />
                </div>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-cici-600 to-cyan-600 bg-clip-text text-transparent">Hoş Geldiniz!</CardTitle>
              <CardDescription>Giriş yapın veya hesap oluşturun</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-cici-50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-cici-500 data-[state=active]:text-white">Giriş Yap</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-cici-500 data-[state=active]:text-white">Kayıt Ol</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e?.target?.value ?? '')}
                        required
                        className="border-cici-200 focus:border-cici-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Şifre</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e?.target?.value ?? '')}
                        required
                        className="border-cici-200 focus:border-cici-500"
                      />
                    </div>
                    <ReCaptcha 
                      onVerify={handleLoginCaptchaVerify} 
                      onExpire={handleCaptchaExpire}
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-cici-500 to-cyan-500 hover:from-cici-600 hover:to-cyan-600 text-white shadow-lg" disabled={isLoading || !loginCaptchaToken}>
                      {isLoading ? 'Yükleniyor...' : 'Giriş Yap'}
                    </Button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-cici-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/80 px-2 text-gray-500">veya</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-cici-200 hover:bg-cici-50"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google ile Giriş Yap
                  </Button>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Ad Soyad</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Adınız Soyadınız"
                        value={signupName}
                        onChange={(e) => setSignupName(e?.target?.value ?? '')}
                        required
                        className="border-cici-200 focus:border-cici-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e?.target?.value ?? '')}
                        required
                        className="border-cici-200 focus:border-cici-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Şifre</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e?.target?.value ?? '')}
                        required
                        className="border-cici-200 focus:border-cici-500"
                      />
                    </div>
                    <ReCaptcha 
                      onVerify={handleSignupCaptchaVerify} 
                      onExpire={handleCaptchaExpire}
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-cici-500 to-cyan-500 hover:from-cici-600 hover:to-cyan-600 text-white shadow-lg" disabled={isLoading || !signupCaptchaToken}>
                      {isLoading ? 'Yükleniyor...' : 'Kayıt Ol (100 CiciPuan Kazan!)'}
                    </Button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-cici-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/80 px-2 text-gray-500">veya</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-cici-200 hover:bg-cici-50"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google ile Kayıt Ol
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-cici-100 bg-white/50 backdrop-blur-sm py-4 relative z-10">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>© 2026 CiciPet - Sevgiyi Hisset 🐾</p>
        </div>
      </footer>
    </div>
  );
}
