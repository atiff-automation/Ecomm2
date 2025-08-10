'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CheckCircle, ArrowLeft, Gift, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MembershipPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [freshUserData, setFreshUserData] = useState<{
    id: string;
    name?: string;
    email?: string;
    isMember: boolean;
    memberSince?: string;
    role?: string;
  } | null>(null);

  // Fetch fresh user data once on component mount
  useEffect(() => {
    const fetchFreshData = async () => {
      if (!session?.user?.id || freshUserData) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const userData = await response.json();
          setFreshUserData(userData);

          // Silently update session if membership changed
          if (userData.isMember !== session?.user?.isMember) {
            update();
          }
        }
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
        // Fallback to session data
        setFreshUserData(session.user);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreshData();
  }, [session?.user?.id, session?.user?.isMember, update, freshUserData]);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to view your membership status
            </p>
            <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use fresh data if available, fallback to session data
  const currentUser = freshUserData || session?.user;
  const currentMembershipStatus = currentUser?.isMember || false;

  if (isLoading && !freshUserData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading membership status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">
            Membership Status
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your membership and view benefits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Membership Status Card */}
          <Card
            className={
              currentMembershipStatus
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200'
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown
                    className={`w-6 h-6 ${currentMembershipStatus ? 'text-green-600' : 'text-gray-400'}`}
                  />
                  Membership Status
                </CardTitle>
                <Badge
                  variant={currentMembershipStatus ? 'default' : 'secondary'}
                  className={currentMembershipStatus ? 'bg-green-600' : ''}
                >
                  {currentMembershipStatus ? 'Active Member' : 'Non-Member'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {currentMembershipStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Membership Active</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    You have full access to member benefits and pricing.
                  </p>
                  <div className="bg-green-100 rounded-lg p-3 mt-4">
                    <h4 className="font-medium text-green-800 mb-2">
                      Your Benefits:
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Exclusive member pricing on all products</li>
                      <li>• Early access to new product launches</li>
                      <li>• Special promotions and deals</li>
                      <li>• Priority customer support</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    You are not currently a member. Make a qualifying purchase
                    of MYR 80 or more to automatically become a member!
                  </p>
                  <Link href="/products">
                    <Button className="w-full mt-4">
                      <Gift className="w-4 h-4 mr-2" />
                      Shop Now
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Name
                </label>
                <p className="text-gray-900">
                  {currentUser?.name || 'Unknown User'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Email
                </label>
                <p className="text-gray-900">
                  {currentUser?.email || 'No email'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Role
                </label>
                <Badge variant="outline">
                  {currentUser?.role || 'CUSTOMER'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Message for New Members */}
        {currentMembershipStatus && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  🎉 Welcome to JRM Holistik Membership!
                </h2>
                <p className="text-green-700 mb-4">
                  Your membership is now active. Start enjoying member benefits
                  on your next purchase!
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/products">
                    <Button>Shop with Member Pricing</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline">Return Home</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
