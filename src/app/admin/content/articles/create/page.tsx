/**
 * Admin Article Create Page - JRM E-commerce Platform
 * Uses unified ArticleForm component following @CLAUDE.md principles
 */

'use client';

import React from 'react';
import { ArticleForm } from '@/components/admin/ArticleForm';

export default function AdminArticleCreatePage() {
  return <ArticleForm mode="create" />;
}
