/**
 * Agent Application Page
 * Public page for agent application submission
 * Following CLAUDE.md principles: Systematic implementation, user-focused design
 */

import { Metadata } from 'next';
import { AgentApplicationForm } from '@/components/forms/agent-application/AgentApplicationForm';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Permohonan Ejen JRM | Jutawan Bonda 4',
  description: 'Sertai program Jutawan Bonda 4 dan mulakan perjalanan kejayaan anda sebagai ejen JRM. Daftar sekarang untuk peluang pendapatan yang menarik.',
  keywords: 'ejen JRM, jutawan bonda, permohonan ejen, peluang perniagaan, MLM Malaysia',
  openGraph: {
    title: 'Permohonan Ejen JRM | Jutawan Bonda 4',
    description: 'Sertai program Jutawan Bonda 4 dan mulakan perjalanan kejayaan anda sebagai ejen JRM.',
    type: 'website',
  },
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Memuatkan borang permohonan...</p>
      </div>
    </div>
  );
}

export default function AgentApplicationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AgentApplicationForm />
    </Suspense>
  );
}