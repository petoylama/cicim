'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { BREED_DATA, SPECIES_OPTIONS, GENDER_OPTIONS, TURKEY_CITIES } from '@/lib/breed-data';

interface PetFormProps {
  pet?: any;
}

export default function PetForm({ pet }: PetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [breedOptions, setBreedOptions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: pet?.name ?? '',
    species: pet?.species?.toLowerCase() ?? '',
    breed: pet?.breed ?? '',
    gender: pet?.gender?.toLowerCase() ?? '',
    age: pet?.age ?? '',
    location: pet?.location ?? '',
    description: pet?.description ?? '',
    imageUrl: pet?.imageUrl ?? '',
    cloudStoragePath: pet?.cloudStoragePath ?? '',
    isPublic: pet?.isPublic ?? true,
    lookingForMatch: pet?.lookingForMatch ?? false,
  });

  useEffect(() => {
    if (formData.species && BREED_DATA[formData.species]) {
      setBreedOptions(BREED_DATA[formData.species]);
    } else {
      setBreedOptions([]);
    }
  }, [formData.species]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Hata', description: 'Dosya boyutu 5MB\'dan küçük olmalı', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);

      // Görsel kontrolü (NSFW ve evcil hayvan) - ZORUNLU
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        try {
          const checkRes = await fetch('/api/image-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          
          if (!checkRes.ok) {
            toast({ title: 'Hata', description: 'Görsel doğrulama servisi kullanılamıyor. Lütfen daha sonra tekrar deneyin.', variant: 'destructive' });
            setUploading(false);
            return;
          }
          
          const checkResult = await checkRes.json();
          
          // GÜVENLİK: Her iki kontrolü de geçmesi ZORUNLU
          if (!checkResult.isAppropriate) {
            toast({ title: 'Uygunsuz Görsel', description: checkResult.message || 'Bu görsel yüklenemez.', variant: 'destructive' });
            setUploading(false);
            return;
          }
          if (!checkResult.hasPet) {
            toast({ title: 'Evcil Hayvan Yok', description: checkResult.message || 'Görselde evcil hayvan bulunamadı.', variant: 'destructive' });
            setUploading(false);
            return;
          }
        } catch (checkError) {
          console.error('Image check error:', checkError);
          // GÜVENLİK: Hata durumunda yüklemeye izin verme
          toast({ title: 'Hata', description: 'Görsel kontrolü başarısız. Lütfen tekrar deneyin.', variant: 'destructive' });
          setUploading(false);
          return;
        }

        // Presigned URL al
        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
        });

        const { uploadUrl, cloud_storage_path } = await presignedRes.json();

        const url = new URL(uploadUrl);
        const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders');
        const needsContentDisposition = signedHeaders?.includes?.('content-disposition');

        const uploadHeaders: HeadersInit = { 'Content-Type': file.type };
        if (needsContentDisposition) uploadHeaders['Content-Disposition'] = 'attachment';

        await fetch(uploadUrl, { method: 'PUT', headers: uploadHeaders, body: file });

        const completeRes = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cloud_storage_path, isPublic: true }),
        });

        const { url: fileUrl } = await completeRes.json();

        setFormData(prev => ({ ...prev, imageUrl: fileUrl, cloudStoragePath: cloud_storage_path, isPublic: true }));
        toast({ title: 'Başarılı', description: 'Resim yüklendi' });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Hata', description: 'Resim yüklenemedi', variant: 'destructive' });
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = pet ? `/api/pets/${pet.id}` : '/api/pets';
      const method = pet ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save pet');

      toast({ title: 'Başarılı!', description: pet ? 'Pet güncellendi' : 'Pet eklendi ve onay bekliyor' });
      router.push('/pets');
    } catch (error: any) {
      toast({ title: 'Hata', description: error?.message ?? 'İşlem başarısız', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/pets" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" /> Geri
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>{pet ? 'Pet Düzenle' : 'Yeni Pet Ekle'}</CardTitle>
            <CardDescription>{pet ? 'Petinin bilgilerini güncelleyin' : 'Yeni bir pet profili oluşturun'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Pet Fotoğrafı</Label>
                <div className="flex items-center gap-4">
                  {formData.imageUrl && (
                    <div className="relative aspect-square w-32 overflow-hidden rounded-lg bg-muted">
                      <Image loading="eager" src={formData.imageUrl} alt="Pet" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="max-w-xs" />
                    {uploading && <p className="mt-2 text-sm text-gray-600">Yükleniyor...</p>}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">İsim *</Label>
                <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: Boncuk" />
              </div>

              {/* Species */}
              <div className="space-y-2">
                <Label htmlFor="species">Tür *</Label>
                <Select value={formData.species} onValueChange={(value) => setFormData({ ...formData, species: value, breed: '' })}>
                  <SelectTrigger><SelectValue placeholder="Tür seçin" /></SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Breed - Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="breed">Cins</Label>
                <Select value={formData.breed} onValueChange={(value) => setFormData({ ...formData, breed: value })} disabled={!formData.species}>
                  <SelectTrigger><SelectValue placeholder={formData.species ? 'Cins seçin' : 'Önce tür seçin'} /></SelectTrigger>
                  <SelectContent>
                    {breedOptions.map(breed => (
                      <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender & Age */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger><SelectValue placeholder="Cinsiyet seçin" /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Yaş</Label>
                  <Input id="age" type="number" min="0" max="30" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Örn: 2" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Konum</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                  <SelectTrigger><SelectValue placeholder="Şehir seçin" /></SelectTrigger>
                  <SelectContent>
                    {TURKEY_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Petiniz hakkında birkaç cümle yazın..." rows={4} />
              </div>

              {/* Looking for Match */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Eş Arıyor</Label>
                  <p className="text-sm text-gray-500">Petiniz eşleşme sayfasında görünsün mü?</p>
                </div>
                <Switch checked={formData.lookingForMatch} onCheckedChange={(checked) => setFormData({ ...formData, lookingForMatch: checked })} />
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Vazgeç</Button>
                <Button type="submit" disabled={loading || uploading} className="flex-1">
                  {loading ? 'Kaydediliyor...' : pet ? 'Güncelle' : 'Pet Ekle'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
