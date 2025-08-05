import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="mx-auto h-24 w-24 text-red-500 mb-6">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>

          <p className="text-gray-600 mb-8">
            You don&apos;t have permission to access this page. Please contact
            an administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">Return to Homepage</Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/signin">Sign In with Different Account</Link>
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          <p>Error Code: 403 - Forbidden</p>
        </div>
      </div>
    </div>
  );
}
