/**
 * Terms Step Component
 * First step: Terms & Conditions acceptance
 * Following CLAUDE.md principles: Reusable, systematic implementation
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AgentApplicationFormData } from '@/types/agent-application';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, AlertTriangle } from 'lucide-react';

interface TermsStepProps {
  form: UseFormReturn<AgentApplicationFormData>;
}

export function TermsStep({ form }: TermsStepProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const acceptTerms = watch('acceptTerms');

  const handleAcceptChange = (checked: boolean) => {
    setValue('acceptTerms', checked, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      {/* Terms Content */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Syarat Pengambilan Jutawan Bonda 4
            </h3>
          </div>

          <ScrollArea className="h-64 w-full rounded-md border p-4 bg-gray-50">
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  1. Kelayakan Pemohon
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Berumur 18 tahun ke atas</li>
                  <li>Warganegara Malaysia yang sah</li>
                  <li>
                    Mempunyai pengalaman dalam bidang perniagaan atau pemasaran
                  </li>
                  <li>Komited untuk menjalankan perniagaan dengan JRM</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  2. Tanggungjawab Ejen
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Mempromosikan produk JRM dengan jujur dan beretika</li>
                  <li>
                    Mengikuti semua garis panduan dan prosedur yang ditetapkan
                  </li>
                  <li>
                    Mengekalkan standard kualiti perkhidmatan pelanggan yang
                    tinggi
                  </li>
                  <li>Menghadiri latihan dan bengkel yang diwajibkan</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  3. Komisi dan Pendapatan
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Komisi berdasarkan pencapaian jualan bulanan</li>
                  <li>Bonus prestasi untuk pencapaian sasaran</li>
                  <li>Peluang pendapatan pasif melalui sistem downline</li>
                  <li>Pembayaran komisi pada setiap bulan</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  4. Sokongan Syarikat
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Latihan komprehensif untuk ejen baru</li>
                  <li>Sokongan pemasaran dan promosi</li>
                  <li>Platform digital untuk pengurusan jualan</li>
                  <li>Khidmat pelanggan 24/7</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  5. Syarat Pembatalan
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Notis 30 hari untuk pembatalan keagenanan</li>
                  <li>Tidak melanggar mana-mana terma dan syarat</li>
                  <li>Penyelesaian semua urusan kewangan yang tertunggak</li>
                  <li>Pemulangan semua bahan promosi syarikat</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    <strong>Important:</strong> By checking the box below, you
                    acknowledge that you have read, understood, and agree to
                    comply with all the terms and conditions stated above.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Acceptance Checkbox */}
      <Card
        className={`border-2 ${errors.acceptTerms ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
      >
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms || false}
              onCheckedChange={handleAcceptChange}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="acceptTerms"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                Saya mengaku telah membaca dan memahami sepenuhnya semua syarat
                dan terma yang dinyatakan di atas. Saya bersetuju untuk mematuhi
                semua peraturan dan garis panduan yang telah ditetapkan oleh JRM
                sebagai syarat untuk menjadi ejen yang sah.
              </Label>

              {errors.acceptTerms && (
                <p className="text-sm text-red-600 mt-2 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Anda perlu bersetuju dengan syarat dan terma untuk
                    meneruskan
                  </span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Additional Information</p>
            <p>
              If you have any questions regarding these terms and conditions,
              please contact our support team at{' '}
              <span className="font-medium">support@jrm.com.my</span> atau{' '}
              <span className="font-medium">03-1234-5678</span> before
              proceeding with your application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
