'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, AlertTriangle, Heart, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { BREED_DATA, SPECIES_OPTIONS, GENDER_OPTIONS } from '@/lib/breed-data';

const AGE_OPTIONS = [
  { value: 'yavru', label: 'Yavru' },
  { value: 'genç', label: 'Genç' },
  { value: 'yetişkin', label: 'Yetişkin' },
  { value: 'yaşlı', label: 'Yaşlı' },
];

const MAX_IMAGES = 5;

export default function NewListingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [type, setType] = useState<'lost' | 'adoption'>('lost');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    petName: '',
    species: '',
    breed: '',
    gender: '',
    age: '',
    color: '',
    location: '',
    contactPhone: '',
    contactEmail: session?.user?.email || '',
    lastSeenDate: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'species') {
      // Reset breed when species changes
      setFormData({ ...formData, species: value, breed: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function uploadImage(): Promise<{ imageUrl: string; cloudStoragePath: string; isPublic: boolean } | null> {
    if (!imageFile) return null;

    try {
      // Get presigned URL
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: imageFile.name,
          contentType: imageFile.type,
          isPublic: true,
        }),
      });

      if (!presignRes.ok) throw new Error('Presign failed');
      const { uploadUrl, cloud_storage_path } = await presignRes.json();

      // Upload to S3
      const headers: HeadersInit = { 'Content-Type': imageFile.type };
      if (uploadUrl.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: imageFile,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      // Complete upload
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path, isPublic: true }),
      });

      if (!completeRes.ok) throw new Error('Complete failed');
      const { url } = await completeRes.json();

      return { imageUrl: url, cloudStoragePath: cloud_storage_path, isPublic: true };
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.petName || !formData.species || !formData.location) {
      toast({ title: 'Hata', description: 'Lütfen zorunlu alanları doldurun.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      let imageData = null;
      if (imageFile) {
        imageData = await uploadImage();
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          ...formData,
          imageUrl: imageData?.imageUrl,
          cloudStoragePath: imageData?.cloudStoragePath,
          isPublic: imageData?.isPublic ?? false,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'Başarılı', description: 'İlanınız oluşturuldu!' });
        router.push(`/listings/${data.id}`);
      } else {
        toast({ title: 'Hata', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Bir hata oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/listings" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          İlanlara Dön
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Yeni İlan Oluştur</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Type Selection */}
            <div className="flex gap-4 mb-6">
              <Button
                type="button"
                variant={type === 'lost' ? 'default' : 'outline'}
                className={type === 'lost' ? 'bg-red-500 hover:bg-red-600' : ''}
                onClick={() => setType('lost')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Kayıp İlanı
              </Button>
              <Button
                type="button"
                variant={type === 'adoption' ? 'default' : 'outline'}
                className={type === 'adoption' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                onClick={() => setType('adoption')}
              >
                <Heart className="h-4 w-4 mr-2" />
                Sahiplendirme
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">İlan Başlığı *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder={type === 'lost' ? 'Örn: Ankara Çankaya\'da kayıp kedi' : 'Örn: 3 aylık yavru kedi sahiplendirme'}
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Pet Name & Species */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="petName">Hayvan Adı *</Label>
                  <Input
                    id="petName"
                    name="petName"
                    placeholder="Örn: Pamuk"
                    value={formData.petName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label>Tür *</Label>
                  <Select value={formData.species} onValueChange={(v) => handleSelectChange('species', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIES_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Breed (conditional on species) */}
              {formData.species && BREED_DATA[formData.species] && (
                <div>
                  <Label>Cins</Label>
                  <Select value={formData.breed} onValueChange={(v) => handleSelectChange('breed', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cins seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {BREED_DATA[formData.species].map((breed) => (
                        <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Color */}
              <div>
                <Label htmlFor="color">Renk</Label>
                <Input
                  id="color"
                  name="color"
                  placeholder="Örn: Turuncu-beyaz"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>

              {/* Gender & Age */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cinsiyet</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleSelectChange('gender', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Yaş</Label>
                  <Select value={formData.age} onValueChange={(v) => handleSelectChange('age', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Konum *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Örn: Ankara, Çankaya"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Last Seen Date (for lost) */}
              {type === 'lost' && (
                <div>
                  <Label htmlFor="lastSeenDate">Son Görüldüğü Tarih</Label>
                  <Input
                    id="lastSeenDate"
                    name="lastSeenDate"
                    type="date"
                    value={formData.lastSeenDate}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={type === 'lost' ? 'Hayvanınızın özelliklerini, nerede kaybolduğunu ve diğer önemli bilgileri yazın...' : 'Sahiplendirmek istediğiniz hayvanın özelliklerini, sağlık durumunu ve diğer bilgileri yazın...'}
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  required
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">İletişim Telefonu</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    placeholder="0555 555 55 55"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">İletişim E-posta</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Fotoğraf</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                      >
                        Kaldır
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Fotoğraf yükle</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Oluşturuluyor...</>
                ) : (
                  'İlanı Yayınla'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
