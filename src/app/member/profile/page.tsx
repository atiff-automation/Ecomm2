/**
 * Member Profile Page - Malaysian E-commerce Platform
 * Comprehensive member profile management with purchase history and savings tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Award,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Gift,
  Star,
  Download,
  Edit,
  Save,
  X,
} from 'lucide-react';

interface MemberStats {
  totalSavings: number;
  totalOrders: number;
  memberSince: string;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategory: string;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  memberSavings: number;
  itemCount: number;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
}

export default function MemberProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/member/profile');
      return;
    }

    if (!session.user.isMember) {
      router.push('/');
      return;
    }

    fetchMemberData();
  }, [session, status, router]);

  const fetchMemberData = async () => {
    try {
      const [statsResponse, ordersResponse, profileResponse] =
        await Promise.all([
          fetch('/api/member/stats'),
          fetch('/api/member/orders?limit=10'),
          fetch('/api/member/profile'),
        ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMemberStats(statsData.stats);
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders);
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData.profile);
        setEditedProfile(profileData.profile);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithCSRF('/api/member/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      if (response.ok) {
        setUserProfile(editedProfile);
        setIsEditing(false);
        // Update session data
        await update();
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch {
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userProfile?.firstName || 'Member'}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-600 text-white">
                <Star className="w-3 h-3 mr-1" />
                Premium Member
              </Badge>
              {memberStats?.memberSince && (
                <span className="text-sm text-gray-600">
                  Member since {formatDate(memberStats.memberSince)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Member Stats Overview */}
      {memberStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(memberStats.totalSavings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {memberStats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(memberStats.totalSpent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Order</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(memberStats.averageOrderValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Section */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile & Settings</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="benefits">Member Benefits</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedProfile(userProfile);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {userProfile && editedProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editedProfile.firstName}
                        onChange={e =>
                          setEditedProfile({
                            ...editedProfile,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editedProfile.lastName}
                        onChange={e =>
                          setEditedProfile({
                            ...editedProfile,
                            lastName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email}
                        onChange={e =>
                          setEditedProfile({
                            ...editedProfile,
                            email: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={editedProfile.phone || ''}
                        onChange={e =>
                          setEditedProfile({
                            ...editedProfile,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+60 12-345-6789"
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={editedProfile.dateOfBirth || ''}
                        onChange={e =>
                          setEditedProfile({
                            ...editedProfile,
                            dateOfBirth: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label>Member Status</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-600 text-white">
                          <Award className="w-3 h-3 mr-1" />
                          Premium Member
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Active since{' '}
                          {memberStats?.memberSince
                            ? formatDate(memberStats.memberSince)
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Recent Orders
              </CardTitle>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  // Export order history
                  window.location.href = '/api/member/orders/export';
                }}
              >
                <Download className="w-4 h-4" />
                Export History
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">
                            #{order.orderNumber}
                          </span>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span>{order.itemCount} items</span>
                          {order.memberSavings > 0 && (
                            <span className="text-green-600 font-medium">
                              Saved {formatPrice(order.memberSavings)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatPrice(order.total)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/member/orders/${order.id}`)
                          }
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No orders found</p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push('/products')}
                  >
                    Start Shopping
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Your Member Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">
                      Exclusive Member Pricing
                    </p>
                    <p className="text-sm text-green-700">
                      Save up to 15% on all products
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">
                      Priority Customer Service
                    </p>
                    <p className="text-sm text-blue-700">
                      Dedicated support and faster response times
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">
                      Early Access
                    </p>
                    <p className="text-sm text-purple-700">
                      First access to sales and new products
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Member Savings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {memberStats && (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        Total Savings as a Member
                      </p>
                      <p className="text-4xl font-bold text-green-600">
                        {formatPrice(memberStats.totalSavings)}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Orders</span>
                        <span className="font-semibold">
                          {memberStats.totalOrders}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Spent</span>
                        <span className="font-semibold">
                          {formatPrice(memberStats.totalSpent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Average Order Value
                        </span>
                        <span className="font-semibold">
                          {formatPrice(memberStats.averageOrderValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Favorite Category</span>
                        <span className="font-semibold">
                          {memberStats.favoriteCategory || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
