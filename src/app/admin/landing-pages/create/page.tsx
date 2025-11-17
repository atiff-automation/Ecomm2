/**
 * Admin Landing Page Create Page - JRM E-commerce Platform
 * Uses unified LandingPageForm component following @CLAUDE.md principles
 */

'use client';

import React from 'react';
import { LandingPageForm } from '@/components/admin/LandingPageForm';

export default function AdminLandingPageCreatePage() {
  return <LandingPageForm mode="create" />;
}
