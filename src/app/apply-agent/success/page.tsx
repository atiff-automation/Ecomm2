/**
 * Agent Application Success Page
 * Confirmation page after successful application submission
 * Following CLAUDE.md principles: User-focused design, clear communication
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import {
  CheckCircle,
  Clock,
  Mail,
  Phone,
  ArrowRight,
  Home,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Permohonan Berjaya | JRM Agent Application',
  description:
    'Permohonan ejen JRM anda telah berjaya dihantar. Kami akan menghubungi anda tidak lama lagi.',
  robots: 'noindex, nofollow', // Prevent indexing of success pages
};

interface SuccessPageProps {
  searchParams: { id?: string };
}

function SuccessContent({ applicationId }: { applicationId?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Permohonan Berjaya Dihantar!
          </h1>
          <p className="text-gray-600">
            Terima kasih kerana berminat untuk menjadi ejen JRM
          </p>
          {applicationId && (
            <Badge variant="outline" className="mt-3">
              ID Permohonan: {applicationId}
            </Badge>
          )}
        </div>

        {/* Status Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Status Permohonan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <div>
                <p className="font-medium text-green-800">
                  Permohonan Diterima
                </p>
                <p className="text-sm text-gray-600">
                  Permohonan anda telah berjaya dihantar dan sedang menunggu
                  semakan
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 opacity-60">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-600">Dalam Semakan</p>
                <p className="text-sm text-gray-500">
                  Pasukan kami akan menyemak permohonan dalam 3-5 hari bekerja
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 opacity-60">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-600">Keputusan</p>
                <p className="text-sm text-gray-500">
                  Kami akan menghubungi anda dengan keputusan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowRight className="w-5 h-5 text-green-600" />
              <span>Langkah Seterusnya</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Semak Email Anda</p>
                <p className="text-sm text-gray-600">
                  Email pengesahan telah dihantar ke alamat yang anda berikan
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Tunggu Panggilan Kami</p>
                <p className="text-sm text-gray-600">
                  Pasukan kami akan menghubungi anda untuk temu bual awal
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">Sediakan Dokumen</p>
                <p className="text-sm text-gray-600">
                  Sediakan salinan kad pengenalan dan dokumen berkaitan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-3">
              Perlukan Bantuan atau Ada Pertanyaan?
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email: support@jrm.com.my</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Telefon: 03-1234-5678</span>
              </div>
              <p className="text-xs mt-2">
                Waktu operasi: Isnin - Jumaat, 9:00 AM - 6:00 PM
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Reminders */}
        <Card className="mb-8 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-amber-900 mb-3">
              Peringatan Penting
            </h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Pastikan telefon anda sentiasa aktif untuk dihubungi</li>
              <li>Semak folder spam/junk untuk email daripada kami</li>
              <li>
                Jangan buat permohonan berganda - ini akan melambatkan proses
              </li>
              <li>Semua maklumat yang diberikan adalah sulit dan selamat</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Kembali ke Laman Utama</span>
            </Link>
          </Button>

          <Button asChild>
            <Link href="/products" className="flex items-center space-x-2">
              <span>Lihat Produk JRM</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Permohonan ini dijaga kerahsiaan mengikut Akta Perlindungan Data
            Peribadi 2010
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AgentApplicationSuccessPage({
  searchParams,
}: SuccessPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-gray-600">Memuatkan maklumat permohonan...</p>
          </div>
        </div>
      }
    >
      <SuccessContent applicationId={searchParams.id} />
    </Suspense>
  );
}
