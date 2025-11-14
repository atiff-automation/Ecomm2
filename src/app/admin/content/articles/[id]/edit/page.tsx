/**
 * Admin Article Edit Page - JRM E-commerce Platform
 * Uses unified ArticleForm component following @CLAUDE.md principles
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArticleForm } from '@/components/admin/ArticleForm';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

export default function AdminArticleEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const handleDelete = async () => {
    const response = await fetchWithCSRF(`/api/admin/articles/${params.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete article');
    }

    // Success will be handled by the ArticleForm component
  };

  return (
    <ArticleForm
      mode="edit"
      articleId={params.id}
      onDelete={handleDelete}
    />
  );
}
