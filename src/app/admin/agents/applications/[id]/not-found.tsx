/**
 * Not Found Page for Agent Application Detail
 * Following CLAUDE.md principles: User-friendly error handling
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/agents/applications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Senarai
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Permohonan Tidak Dijumpai
            </h1>

            <p className="text-gray-600 mb-6">
              Permohonan yang anda cari tidak wujud atau telah dipadamkan.
            </p>

            <div className="space-y-3">
              <Link href="/admin/agents/applications">
                <Button className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Senarai Permohonan
                </Button>
              </Link>

              <p className="text-sm text-gray-500">
                Atau hubungi pentadbir sistem jika anda percaya ini adalah ralat.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}