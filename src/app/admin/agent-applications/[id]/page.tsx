'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Instagram,
  Facebook,
  MessageSquare,
  Star,
  FileText,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AdminPageLayout,
  type BreadcrumbItem,
} from '@/components/admin/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AgentApplication {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  icNumber: string;
  address: string;
  age: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

  // Business Experience
  hasBusinessExp: boolean;
  businessLocation?: string;
  hasTeamLeadExp: boolean;
  isRegistered: boolean;
  jenis: string;

  // Social Media
  instagramHandle?: string;
  facebookHandle?: string;
  tiktokHandle?: string;
  instagramLevel: string;
  facebookLevel: string;
  tiktokLevel: string;

  // Additional Info
  hasJrmExp: boolean;
  jrmProducts?: string;
  reasonToJoin: string;
  expectations: string;

  // Timestamps
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusIcons = {
  DRAFT: Clock,
  SUBMITTED: AlertCircle,
  UNDER_REVIEW: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
};

const socialMediaLevels = {
  TIDAK_MAHIR: 'Not Skilled',
  MAHIR: 'Skilled',
  SANGAT_MAHIR: 'Very Skilled',
};

const businessTypes = {
  KEDAI: 'Shop',
  MUDAH: 'Easy/Simple',
  TIDAK_BERKAITAN: 'Not Related',
  LAIN_LAIN: 'Others',
};

export default function AgentApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<AgentApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/agent-applications/${applicationId}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch application');
        }
        const data = await response.json();
        setApplication(data);
        setNewStatus(data.status);
        setAdminNotes(data.adminNotes || '');
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const handleStatusUpdate = async () => {
    if (!application || !newStatus) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(
        `/api/admin/agent-applications/${applicationId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            adminNotes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the application data
      const updatedResponse = await fetch(
        `/api/admin/agent-applications/${applicationId}`
      );
      const updatedData = await updatedResponse.json();
      setApplication(updatedData);

      // Show success message (you could add a toast here)
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The requested agent application could not be found.
          </p>
          <Link href="/admin/agent-applications">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: AgentApplication['status']) => {
    const Icon = statusIcons[status];
    return <Icon className="w-4 h-4" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'Not set';
    }
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const applicationDetailsContent = (
    <div className="space-y-6">
      {/* Header with Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {application.fullName}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">ID: {application.id}</p>
            </div>
            <Badge
              className={`flex items-center gap-1 ${statusColors[application.status]}`}
            >
              {getStatusIcon(application.status)}
              {application.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{application.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-gray-600">
                    {application.phoneNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">IC Number</p>
                  <p className="text-sm text-gray-600">
                    {application.icNumber}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Age</p>
                  <p className="text-sm text-gray-600">
                    {application.age} years old
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-gray-600">{application.address}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Has Business Experience</p>
                <Badge
                  variant={application.hasBusinessExp ? 'default' : 'secondary'}
                >
                  {application.hasBusinessExp ? 'Yes' : 'No'}
                </Badge>
              </div>
              {application.hasBusinessExp && application.businessLocation && (
                <div>
                  <p className="text-sm font-medium">Business Location</p>
                  <p className="text-sm text-gray-600">
                    {application.businessLocation}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  Has Team Leadership Experience
                </p>
                <Badge
                  variant={application.hasTeamLeadExp ? 'default' : 'secondary'}
                >
                  {application.hasTeamLeadExp ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Business Registration</p>
                <Badge
                  variant={application.isRegistered ? 'default' : 'secondary'}
                >
                  {application.isRegistered ? 'Registered' : 'Not Registered'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Business Type</p>
                <p className="text-sm text-gray-600">
                  {businessTypes[
                    application.jenis as keyof typeof businessTypes
                  ] || application.jenis}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Social Media Presence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                <p className="text-sm font-medium">Instagram</p>
              </div>
              <p className="text-sm text-gray-600">
                {application.instagramHandle || 'Not provided'}
              </p>
              <Badge variant="outline" className="text-xs">
                {
                  socialMediaLevels[
                    application.instagramLevel as keyof typeof socialMediaLevels
                  ]
                }
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium">Facebook</p>
              </div>
              <p className="text-sm text-gray-600">
                {application.facebookHandle || 'Not provided'}
              </p>
              <Badge variant="outline" className="text-xs">
                {
                  socialMediaLevels[
                    application.facebookLevel as keyof typeof socialMediaLevels
                  ]
                }
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-black" />
                <p className="text-sm font-medium">TikTok</p>
              </div>
              <p className="text-sm text-gray-600">
                {application.tiktokHandle || 'Not provided'}
              </p>
              <Badge variant="outline" className="text-xs">
                {
                  socialMediaLevels[
                    application.tiktokLevel as keyof typeof socialMediaLevels
                  ]
                }
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JRM Experience & Motivation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            JRM Experience & Motivation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-2">Has JRM Experience</p>
              <Badge variant={application.hasJrmExp ? 'default' : 'secondary'}>
                {application.hasJrmExp ? 'Yes' : 'No'}
              </Badge>
              {application.hasJrmExp && application.jrmProducts && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">JRM Products Used</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {application.jrmProducts}
                  </p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Reason to Join</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {application.reasonToJoin}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Expectations</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {application.expectations}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-xs text-gray-600">
                  {formatDate(application.createdAt)}
                </p>
              </div>
            </div>
            {application.submittedAt && (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-xs text-gray-600">
                    {formatDate(application.submittedAt)}
                  </p>
                </div>
              </div>
            )}
            {application.reviewedAt && (
              <div className="flex items-center gap-3">
                {application.status === 'APPROVED' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Reviewed</p>
                  <p className="text-xs text-gray-600">
                    {formatDate(application.reviewedAt)}
                  </p>
                  {application.reviewedBy && (
                    <p className="text-xs text-gray-500">
                      by {application.reviewedBy}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const reviewActionsContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Update Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add notes about the review decision..."
                className="mt-1"
                rows={4}
              />
            </div>
            <Button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === application.status}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {application.adminNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {application.adminNotes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <AdminPageLayout
      title={`Agent Application - ${application.fullName}`}
      subtitle={`Application ID: ${application.id}`}
      actions={
        <Link href="/admin/agent-applications">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Button>
        </Link>
      }
    >
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Application Details</TabsTrigger>
          <TabsTrigger value="review">Review & Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="details">{applicationDetailsContent}</TabsContent>

        <TabsContent value="review">{reviewActionsContent}</TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
