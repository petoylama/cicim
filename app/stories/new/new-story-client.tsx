'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Upload, X, Sparkles, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Pet {
  id: string;
  name: string;
  species: string;
  imageUrl: string | null;
}

export default function NewStoryClient({ pets }: { pets: Pet[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    petId: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<{ imageUrl: string; cloudStoragePath: string } | null> => {
    if (!imageFile) return null;

    try {
      // Presigned URL al
      const presignedResponse = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: imageFile.name,
          contentType: imageFile.type,
          isPublic: true,
        }),
      });

      if (!presignedResponse.ok) throw new Error('Presigned URL alınamadı');

      const { uploadUrl, cloud_storage_path } = await presignedResponse.json();

      // S3'e yükle
      const uploadHeaders: HeadersInit = {
        'Content-Type': imageFile.type,
      };
      if (uploadUrl.includes('content-disposition')) {
        uploadHeaders['Content-Disposition'] = 'attachment';
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: uploadHeaders,
        body: imageFile,
      });

      if (!uploadResponse.ok) throw new Error('Resim yüklenemedi');

      // Complete endpoint'
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloud_storage_path,
          isPublic: true,
        }),
      });

      if (!completeResponse.ok) throw new Error('Yükleme tamamlanamadı');

      const { fileUrl } = await completeResponse.json();
      return { imageUrl: fileUrl, cloudStoragePath: cloud_storage_path };
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: 'Hata',
        description: 'Başlık gerekli',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Hata',
        description: 'İçerik gerekli',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let imageData = null;
      if (imageFile) {
        imageData = await uploadImage();
      }

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          petId: formData.petId || null,
          imageUrl: imageData?.imageUrl || null,
          cloudStoragePath: imageData?.cloudStoragePath || null,
          isPublic: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Tebrikler! 🎉',
          description: `Hikayen paylaşıldı! +${data.pointsEarned} CiciPuan kazandın!`,
        });
        router.push('/stories');
      } else {
        toast({
          title: 'Hata',
          description: data.error || 'Hikaye oluşturulamadı',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSpeciesEmoji = (species: string) => {
    const emojis: { [key: string]: string } = {
      dog: '🐶',
      cat: '🐱',
      bird: '🐦',
      fish: '🐟',
      rabbit: '🐰',
      hamster: '🐹',
      other: '🐾',
    };
    return emojis[species?.toLowerCase()] || '🐾';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/stories"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Hikayelere Dön
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-500" />
              Yeni Hikaye Paylaş
            </CardTitle>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Hikaye paylaşarak +20 CiciPuan kazan!
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  placeholder="Hikayene bir başlık ver..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  maxLength={100}
                />
              </div>

              {/* Pet Selection */}
              {pets.length > 0 && (
                <div className="space-y-2">
                  <Label>Pet Seç (Opsiyonel)</Label>
                  <Select
                    value={formData.petId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, petId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bir pet seç..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Pet seçme</SelectItem>
                      {pets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {getSpeciesEmoji(pet.species)} {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">İçerik *</Label>
                <Textarea
                  id="content"
                  placeholder="Hikayeni yaz... Petin ile yaşadığın eğlenceli anları, gezilerinizi, oyunlarınızı paylaş!"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Fotoğraf (Opsiyonel)</Label>
                {imagePreview ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      Fotoğraf yüklemek için tıklayın
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                disabled={loading}
              >
                {loading ? 'Paylaşılıyor...' : 'Hikayeyi Paylaş'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
