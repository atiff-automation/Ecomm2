/**
 * Social Media Step Component
 * Third step: Social media information and expertise levels
 * Following CLAUDE.md principles: Reusable, systematic implementation
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AgentApplicationFormData, SocialMediaLevel } from '@/types/agent-application';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Instagram, Facebook, Music, Star, Users, TrendingUp } from 'lucide-react';
import { FIELD_LABELS, PLACEHOLDERS, SOCIAL_MEDIA_LEVELS } from '@/lib/config/agent-application-form';

interface SocialMediaStepProps {
  form: UseFormReturn<AgentApplicationFormData>;
}

export function SocialMediaStep({ form }: SocialMediaStepProps) {
  const { register, watch, setValue, formState: { errors } } = form;

  const instagramHandle = watch('instagramHandle');
  const facebookHandle = watch('facebookHandle');
  const tiktokHandle = watch('tiktokHandle');
  const instagramLevel = watch('instagramLevel');
  const facebookLevel = watch('facebookLevel');
  const tiktokLevel = watch('tiktokLevel');

  const getLevelColor = (level: SocialMediaLevel) => {
    switch (level) {
      case 'TIDAK_MAHIR': return 'bg-gray-100 text-gray-700';
      case 'MAHIR': return 'bg-blue-100 text-blue-700';
      case 'SANGAT_MAHIR': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelIcon = (level: SocialMediaLevel) => {
    switch (level) {
      case 'TIDAK_MAHIR': return <Users className="w-3 h-3" />;
      case 'MAHIR': return <Star className="w-3 h-3" />;
      case 'SANGAT_MAHIR': return <TrendingUp className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Instagram Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Instagram className="w-5 h-5 text-pink-600" />
            <span>Instagram</span>
            {instagramLevel && (
              <Badge className={getLevelColor(instagramLevel)}>
                {getLevelIcon(instagramLevel)}
                <span className="ml-1">{SOCIAL_MEDIA_LEVELS[instagramLevel]}</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instagram Handle */}
            <div>
              <Label htmlFor="instagramHandle" className="text-sm font-medium">
                {FIELD_LABELS.instagramHandle}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                <Input
                  id="instagramHandle"
                  {...register('instagramHandle')}
                  placeholder={PLACEHOLDERS.instagramHandle}
                  className={`pl-8 ${errors.instagramHandle ? 'border-red-300' : ''}`}
                />
              </div>
              {errors.instagramHandle && (
                <p className="text-sm text-red-600 mt-1">{errors.instagramHandle.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Contoh: namapelanggan (tanpa @)</p>
            </div>

            {/* Instagram Level */}
            <div>
              <Label htmlFor="instagramLevel" className="text-sm font-medium">
                {FIELD_LABELS.instagramLevel} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={instagramLevel || ''}
                onValueChange={(value) => setValue('instagramLevel', value as SocialMediaLevel)}
              >
                <SelectTrigger className={errors.instagramLevel ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Pilih tahap kemahiran" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOCIAL_MEDIA_LEVELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        {getLevelIcon(key as SocialMediaLevel)}
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.instagramLevel && (
                <p className="text-sm text-red-600 mt-1">{errors.instagramLevel.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facebook Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Facebook className="w-5 h-5 text-blue-600" />
            <span>Facebook</span>
            {facebookLevel && (
              <Badge className={getLevelColor(facebookLevel)}>
                {getLevelIcon(facebookLevel)}
                <span className="ml-1">{SOCIAL_MEDIA_LEVELS[facebookLevel]}</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facebook Handle */}
            <div>
              <Label htmlFor="facebookHandle" className="text-sm font-medium">
                {FIELD_LABELS.facebookHandle}
              </Label>
              <Input
                id="facebookHandle"
                {...register('facebookHandle')}
                placeholder={PLACEHOLDERS.facebookHandle}
                className={errors.facebookHandle ? 'border-red-300' : ''}
              />
              {errors.facebookHandle && (
                <p className="text-sm text-red-600 mt-1">{errors.facebookHandle.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">URL atau nama profil Facebook</p>
            </div>

            {/* Facebook Level */}
            <div>
              <Label htmlFor="facebookLevel" className="text-sm font-medium">
                {FIELD_LABELS.facebookLevel} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={facebookLevel || ''}
                onValueChange={(value) => setValue('facebookLevel', value as SocialMediaLevel)}
              >
                <SelectTrigger className={errors.facebookLevel ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Pilih tahap kemahiran" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOCIAL_MEDIA_LEVELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        {getLevelIcon(key as SocialMediaLevel)}
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.facebookLevel && (
                <p className="text-sm text-red-600 mt-1">{errors.facebookLevel.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TikTok Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-gray-900" />
            <span>TikTok</span>
            {tiktokLevel && (
              <Badge className={getLevelColor(tiktokLevel)}>
                {getLevelIcon(tiktokLevel)}
                <span className="ml-1">{SOCIAL_MEDIA_LEVELS[tiktokLevel]}</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TikTok Handle */}
            <div>
              <Label htmlFor="tiktokHandle" className="text-sm font-medium">
                {FIELD_LABELS.tiktokHandle}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                <Input
                  id="tiktokHandle"
                  {...register('tiktokHandle')}
                  placeholder={PLACEHOLDERS.tiktokHandle}
                  className={`pl-8 ${errors.tiktokHandle ? 'border-red-300' : ''}`}
                />
              </div>
              {errors.tiktokHandle && (
                <p className="text-sm text-red-600 mt-1">{errors.tiktokHandle.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Contoh: namapelanggan (tanpa @)</p>
            </div>

            {/* TikTok Level */}
            <div>
              <Label htmlFor="tiktokLevel" className="text-sm font-medium">
                {FIELD_LABELS.tiktokLevel} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={tiktokLevel || ''}
                onValueChange={(value) => setValue('tiktokLevel', value as SocialMediaLevel)}
              >
                <SelectTrigger className={errors.tiktokLevel ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Pilih tahap kemahiran" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOCIAL_MEDIA_LEVELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        {getLevelIcon(key as SocialMediaLevel)}
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tiktokLevel && (
                <p className="text-sm text-red-600 mt-1">{errors.tiktokLevel.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-3">Panduan Tahap Kemahiran</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center space-x-3">
              <Badge className="bg-gray-100 text-gray-700">
                <Users className="w-3 h-3 mr-1" />
                Tidak Mahir
              </Badge>
              <span>Baru menggunakan platform, memerlukan bimbingan</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-700">
                <Star className="w-3 h-3 mr-1" />
                Mahir
              </Badge>
              <span>Biasa menggunakan untuk pemasaran dan komunikasi</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-100 text-green-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                Sangat Mahir
              </Badge>
              <span>Pakar dalam strategi konten dan pertumbuhan engagement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Mengapa Maklumat Media Sosial Penting?</p>
            <p>
              Kemahiran media sosial adalah aset penting untuk ejen JRM. Platform ini membantu kami
              memahami kekuatan anda dalam pemasaran digital dan memberikan sokongan yang sesuai
              untuk memaksimumkan potensi jualan anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}