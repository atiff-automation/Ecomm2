/**
 * Review Step Component
 * Fifth and final step: Review all information and final submission
 * Following CLAUDE.md principles: Reusable, systematic implementation
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AgentApplicationFormData } from '@/types/agent-application';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Instagram,
  Facebook,
  Music,
  Heart,
  Target,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { FIELD_LABELS, SOCIAL_MEDIA_LEVELS } from '@/lib/config/agent-application-form';

interface ReviewStepProps {
  form: UseFormReturn<AgentApplicationFormData>;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const { watch, setValue, formState: { errors } } = form;

  const formData = watch();
  const finalAgreement = watch('finalAgreement');

  const getSocialMediaIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'tiktok': return <Music className="w-4 h-4 text-gray-900" />;
      default: return null;
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Format Malaysian phone numbers
    return phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Maklumat Peribadi</span>
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Lengkap
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nama Penuh</p>
              <p className="font-medium">{formData.fullName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">No. KP</p>
              <p className="font-medium">{formData.icNumber || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Umur</p>
              <p className="font-medium">{formData.age ? `${formData.age} tahun` : '-'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">No. Telefon</p>
                <p className="font-medium">{formatPhoneNumber(formData.phoneNumber || '')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{formData.email || '-'}</p>
              </div>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Alamat</p>
              <p className="font-medium text-sm">{formData.address || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Experience Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-green-600" />
            <span>Pengalaman Perniagaan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${formData.hasBusinessExp ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm text-gray-600">Pengalaman Perniagaan</p>
                <p className="font-medium">{formData.hasBusinessExp ? 'Ya' : 'Tidak'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${formData.hasTeamLeadExp ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm text-gray-600">Pengalaman Memimpin</p>
                <p className="font-medium">{formData.hasTeamLeadExp ? 'Ya' : 'Tidak'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${formData.isRegistered ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm text-gray-600">Perniagaan Berdaftar</p>
                <p className="font-medium">{formData.isRegistered ? 'Ya' : 'Tidak'}</p>
              </div>
            </div>
          </div>
          {formData.hasBusinessExp && formData.businessLocation && (
            <>
              <Separator className="my-3" />
              <div>
                <p className="text-sm text-gray-600">Lokasi Perniagaan</p>
                <p className="font-medium">{formData.businessLocation}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Social Media Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Instagram className="w-5 h-5 text-pink-600" />
            <span>Media Sosial</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instagram */}
          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getSocialMediaIcon('instagram')}
              <div>
                <p className="font-medium">Instagram</p>
                <p className="text-sm text-gray-600">
                  {formData.instagramHandle ? `@${formData.instagramHandle}` : 'Tidak dinyatakan'}
                </p>
              </div>
            </div>
            <Badge className="bg-white/50">
              {formData.instagramLevel ? SOCIAL_MEDIA_LEVELS[formData.instagramLevel] : '-'}
            </Badge>
          </div>

          {/* Facebook */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getSocialMediaIcon('facebook')}
              <div>
                <p className="font-medium">Facebook</p>
                <p className="text-sm text-gray-600">
                  {formData.facebookHandle || 'Tidak dinyatakan'}
                </p>
              </div>
            </div>
            <Badge className="bg-white/50">
              {formData.facebookLevel ? SOCIAL_MEDIA_LEVELS[formData.facebookLevel] : '-'}
            </Badge>
          </div>

          {/* TikTok */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getSocialMediaIcon('tiktok')}
              <div>
                <p className="font-medium">TikTok</p>
                <p className="text-sm text-gray-600">
                  {formData.tiktokHandle ? `@${formData.tiktokHandle}` : 'Tidak dinyatakan'}
                </p>
              </div>
            </div>
            <Badge className="bg-white/50">
              {formData.tiktokLevel ? SOCIAL_MEDIA_LEVELS[formData.tiktokLevel] : '-'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-600" />
            <span>Maklumat Tambahan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* JRM Experience */}
          <div className="flex items-center space-x-2">
            <CheckCircle className={`w-4 h-4 ${formData.hasJrmExp ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-600">Pengalaman dengan Produk JRM</p>
              <p className="font-medium">{formData.hasJrmExp ? 'Ya' : 'Tidak'}</p>
            </div>
          </div>

          {formData.hasJrmExp && formData.jrmProducts && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Produk JRM yang Pernah Digunakan</p>
              <p className="text-sm">{formData.jrmProducts}</p>
            </div>
          )}

          <Separator />

          {/* Reason to Join */}
          <div>
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>Sebab Ingin Menyertai JRM</span>
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm">{formData.reasonToJoin || '-'}</p>
            </div>
          </div>

          {/* Expectations */}
          <div>
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>Jangkaan sebagai Ejen JRM</span>
            </p>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm">{formData.expectations || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Agreement */}
      <Card className={`border-2 ${errors.finalAgreement ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="finalAgreement"
              checked={finalAgreement || false}
              onCheckedChange={(checked) => setValue('finalAgreement', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="finalAgreement"
                className="text-sm font-medium leading-relaxed cursor-pointer flex items-start space-x-2"
              >
                <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  Saya dengan ini mengesahkan bahawa semua maklumat yang telah saya berikan adalah benar dan tepat.
                  Saya faham bahawa sebarang maklumat palsu boleh menyebabkan permohonan saya ditolak.
                  Saya bersetuju untuk mematuhi semua syarat dan terma JRM dan komited untuk menjadi ejen yang berjaya.
                </span>
              </Label>

              {errors.finalAgreement && (
                <p className="text-sm text-red-600 mt-2 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Anda perlu mengesahkan maklumat untuk menghantar permohonan</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Langkah Seterusnya</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Permohonan anda akan disemak dalam tempoh 3-5 hari bekerja</li>
              <li>Kami akan menghubungi anda melalui email dan telefon</li>
              <li>Jika diterima, anda akan dijemput untuk sesi orientasi</li>
              <li>Latihan komprehensif akan disediakan untuk ejen baru</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}