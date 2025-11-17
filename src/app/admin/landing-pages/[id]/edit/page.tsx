/**
 * Admin Landing Page Edit Page - JRM E-commerce Platform
 * Uses unified LandingPageForm component following @CLAUDE.md principles
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LandingPageForm } from '@/components/admin/LandingPageForm';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

export default function AdminLandingPageEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const handleDelete = async () => {
    const response = await fetchWithCSRF(`/api/admin/landing-pages/${params.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete landing page');
    }

    // Success will be handled by the LandingPageForm component
  };

  return (
    <LandingPageForm
      mode="edit"
      landingPageId={params.id}
      onDelete={handleDelete}
    />
  );
}
