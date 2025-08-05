import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function MembershipRequiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-blue-500 mb-6">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Member Access Required
          </h1>

          <p className="text-gray-600 mb-8">
            This page is exclusively available to JRM members. Join our
            membership program to access exclusive content and member pricing.
          </p>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">🎉 Member Benefits</CardTitle>
            <CardDescription className="text-blue-700">
              Join our membership program and enjoy exclusive benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Exclusive member pricing on all products
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Free shipping on orders above RM80
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Early access to sales and new products
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Special birthday discounts and offers
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Priority customer support
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/products">Shop Now to Qualify for Membership</Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Membership is automatically offered when you spend RM80+ on
            qualifying products
          </p>
        </div>
      </div>
    </div>
  );
}
