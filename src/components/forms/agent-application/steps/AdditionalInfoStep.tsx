/**
 * Additional Info Step Component
 * Fourth step: JRM experience and motivational information
 * Following CLAUDE.md principles: Reusable, systematic implementation
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AgentApplicationFormData } from '@/types/agent-application';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Target, Package, Lightbulb, Star, CheckCircle } from 'lucide-react';
import { FIELD_LABELS, PLACEHOLDERS } from '@/lib/config/agent-application-form';

interface AdditionalInfoStepProps {
  form: UseFormReturn<AgentApplicationFormData>;
}

export function AdditionalInfoStep({ form }: AdditionalInfoStepProps) {
  const { register, watch, setValue, formState: { errors } } = form;

  const hasJrmExp = watch('hasJrmExp');
  const jrmProducts = watch('jrmProducts');
  const reasonToJoin = watch('reasonToJoin');
  const expectations = watch('expectations');

  return (
    <div className="space-y-6">
      {/* JRM Experience Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <span>Pengalaman JRM</span>
            {hasJrmExp && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ada Pengalaman
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Has JRM Experience */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="hasJrmExp"
              checked={hasJrmExp || false}
              onCheckedChange={(checked) => setValue('hasJrmExp', checked as boolean)}
            />
            <Label htmlFor="hasJrmExp" className="text-sm font-medium cursor-pointer">
              {FIELD_LABELS.hasJrmExp}
            </Label>
          </div>

          {/* JRM Products - conditional */}
          {hasJrmExp && (
            <div>
              <Label htmlFor="jrmProducts" className="text-sm font-medium flex items-center space-x-1">
                <Package className="w-4 h-4" />
                <span>{FIELD_LABELS.jrmProducts}</span>
              </Label>
              <Textarea
                id="jrmProducts"
                {...register('jrmProducts')}
                placeholder={PLACEHOLDERS.jrmProducts}
                className={errors.jrmProducts ? 'border-red-300' : ''}
                rows={3}
              />
              {errors.jrmProducts && (
                <p className="text-sm text-red-600 mt-1">{errors.jrmProducts.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Nyatakan produk JRM yang pernah anda beli atau gunakan
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-600" />
            <span>Motivasi & Matlamat</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reason to Join */}
          <div>
            <Label htmlFor="reasonToJoin" className="text-sm font-medium flex items-center space-x-1">
              <Lightbulb className="w-4 h-4" />
              <span>{FIELD_LABELS.reasonToJoin} <span className="text-red-500">*</span></span>
            </Label>
            <Textarea
              id="reasonToJoin"
              {...register('reasonToJoin')}
              placeholder={PLACEHOLDERS.reasonToJoin}
              className={errors.reasonToJoin ? 'border-red-300' : ''}
              rows={4}
            />
            {errors.reasonToJoin && (
              <p className="text-sm text-red-600 mt-1">{errors.reasonToJoin.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Kongsikan cerita dan motivasi anda untuk menyertai program ejen JRM
            </p>
          </div>

          {/* Expectations */}
          <div>
            <Label htmlFor="expectations" className="text-sm font-medium flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>{FIELD_LABELS.expectations} <span className="text-red-500">*</span></span>
            </Label>
            <Textarea
              id="expectations"
              {...register('expectations')}
              placeholder={PLACEHOLDERS.expectations}
              className={errors.expectations ? 'border-red-300' : ''}
              rows={4}
            />
            {errors.expectations && (
              <p className="text-sm text-red-600 mt-1">{errors.expectations.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Nyatakan matlamat dan jangkaan anda sebagai ejen JRM
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Success Stories Inspiration */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Star className="w-5 h-5" />
            <span>Inspirasi Kejayaan Ejen JRM</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-green-700 space-y-3">
            <div className="flex items-start space-x-3">
              <Badge className="bg-green-100 text-green-700 mt-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Siti, 32
              </Badge>
              <div>
                <p className="font-medium">Pendapatan RM15,000/bulan</p>
                <p className="text-xs">"Dari ibu rumah kepada jutawan - JRM ubah hidup saya!"</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Badge className="bg-blue-100 text-blue-700 mt-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ahmad, 28
              </Badge>
              <div>
                <p className="font-medium">Team 500+ ejen aktif</p>
                <p className="text-xs">"Bina empire downline yang kukuh dalam 2 tahun!"</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Badge className="bg-purple-100 text-purple-700 mt-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Fatimah, 45
              </Badge>
              <div>
                <p className="font-medium">Pencen awal pada umur 45</p>
                <p className="text-xs">"Passive income JRM membolehkan saya fokus pada keluarga!"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Character Requirements */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Kriteria Ejen Berjaya</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Komited dan berdisiplin</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Kemahiran komunikasi yang baik</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Proaktif dalam pembelajaran</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Berintegriti dan jujur</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Visi jangka panjang</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Sanggup bekerja dalam team</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Tips for Writing Good Answers</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Write honestly and sincerely</li>
              <li>Share relevant personal experiences</li>
              <li>State realistic and achievable goals</li>
              <li>Show your long-term commitment to JRM</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}