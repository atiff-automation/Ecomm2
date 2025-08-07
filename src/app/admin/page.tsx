/**
 * Admin Index Page - Redirects to Dashboard
 * JRM E-commerce Platform
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}
