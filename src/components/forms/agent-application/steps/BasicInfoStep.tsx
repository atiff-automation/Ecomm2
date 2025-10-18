/**
 * Basic Info Step Component
 * Second step: Personal and business information
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  IdCard,
  Store,
} from 'lucide-react';
import {
  FIELD_LABELS,
  PLACEHOLDERS,
  BUSINESS_TYPES,
} from '@/lib/config/agent-application-form';

interface BasicInfoStepProps {
  form: UseFormReturn<AgentApplicationFormData>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const hasBusinessExp = watch('hasBusinessExp');
  const hasTeamLeadExp = watch('hasTeamLeadExp');
  const isRegistered = watch('isRegistered');

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Maklumat Peribadi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                {FIELD_LABELS.fullName} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder={PLACEHOLDERS.fullName}
                className={errors.fullName ? 'border-red-300' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* IC Number */}
            <div>
              <Label
                htmlFor="icNumber"
                className="text-sm font-medium flex items-center space-x-1"
              >
                <IdCard className="w-4 h-4" />
                <span>
                  {FIELD_LABELS.icNumber}{' '}
                  <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input
                id="icNumber"
                {...register('icNumber')}
                placeholder={PLACEHOLDERS.icNumber}
                className={errors.icNumber ? 'border-red-300' : ''}
              />
              {errors.icNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.icNumber.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Format: YYMMDD-PP-GGGG
              </p>
            </div>

            {/* Age */}
            <div>
              <Label
                htmlFor="age"
                className="text-sm font-medium flex items-center space-x-1"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {FIELD_LABELS.age} <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="100"
                {...register('age', { valueAsNumber: true })}
                placeholder={PLACEHOLDERS.age}
                className={errors.age ? 'border-red-300' : ''}
              />
              {errors.age && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.age.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Label
                htmlFor="phoneNumber"
                className="text-sm font-medium flex items-center space-x-1"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {FIELD_LABELS.phoneNumber}{' '}
                  <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input
                id="phoneNumber"
                {...register('phoneNumber')}
                placeholder={PLACEHOLDERS.phoneNumber}
                className={errors.phoneNumber ? 'border-red-300' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Contoh: 012-3456789 atau +6012-3456789
              </p>
            </div>

            {/* Email */}
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium flex items-center space-x-1"
              >
                <Mail className="w-4 h-4" />
                <span>
                  {FIELD_LABELS.email} <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder={PLACEHOLDERS.email}
                className={errors.email ? 'border-red-300' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Label
                htmlFor="address"
                className="text-sm font-medium flex items-center space-x-1"
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {FIELD_LABELS.address} <span className="text-red-500">*</span>
                </span>
              </Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder={PLACEHOLDERS.address}
                className={errors.address ? 'border-red-300' : ''}
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-green-600" />
            <span>Pengalaman Perniagaan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Has Business Experience */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="hasBusinessExp"
              checked={hasBusinessExp || false}
              onCheckedChange={checked =>
                setValue('hasBusinessExp', checked as boolean)
              }
            />
            <Label
              htmlFor="hasBusinessExp"
              className="text-sm font-medium cursor-pointer"
            >
              {FIELD_LABELS.hasBusinessExp}
            </Label>
          </div>

          {/* Business Location - conditional */}
          {hasBusinessExp && (
            <div>
              <Label htmlFor="businessLocation" className="text-sm font-medium">
                {FIELD_LABELS.businessLocation}
              </Label>
              <Input
                id="businessLocation"
                {...register('businessLocation')}
                placeholder={PLACEHOLDERS.businessLocation}
                className={errors.businessLocation ? 'border-red-300' : ''}
              />
              {errors.businessLocation && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.businessLocation.message}
                </p>
              )}
            </div>
          )}

          {/* Has Team Lead Experience */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="hasTeamLeadExp"
              checked={hasTeamLeadExp || false}
              onCheckedChange={checked =>
                setValue('hasTeamLeadExp', checked as boolean)
              }
            />
            <Label
              htmlFor="hasTeamLeadExp"
              className="text-sm font-medium cursor-pointer"
            >
              {FIELD_LABELS.hasTeamLeadExp}
            </Label>
          </div>

          {/* Is Registered */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="isRegistered"
              checked={isRegistered || false}
              onCheckedChange={checked =>
                setValue('isRegistered', checked as boolean)
              }
            />
            <Label
              htmlFor="isRegistered"
              className="text-sm font-medium cursor-pointer"
            >
              {FIELD_LABELS.isRegistered}
            </Label>
          </div>

          {/* Business Type */}
          <div>
            <Label
              htmlFor="jenis"
              className="text-sm font-medium flex items-center space-x-1"
            >
              <Store className="w-4 h-4" />
              <span>
                {FIELD_LABELS.jenis} <span className="text-red-500">*</span>
              </span>
            </Label>
            <Select
              value={watch('jenis') || ''}
              onValueChange={value => setValue('jenis', value as any)}
            >
              <SelectTrigger className={errors.jenis ? 'border-red-300' : ''}>
                <SelectValue placeholder="Pilih jenis kedai" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.jenis && (
              <p className="text-sm text-red-600 mt-1">
                {errors.jenis.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <User className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Nota Penting</p>
            <p>
              Pastikan semua maklumat yang diisi adalah tepat dan benar.
              Maklumat ini akan digunakan untuk proses semakan dan komunikasi
              rasmi. Sebarang maklumat palsu boleh menyebabkan permohonan anda
              ditolak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
