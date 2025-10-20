/**
 * Application Detail Component
 * Detailed view of a single agent application
 * Following CLAUDE.md principles: Comprehensive data display, systematic implementation
 */

'use client';

import React, { useState } from 'react';
import { AgentApplicationWithRelations } from '@/types/agent-application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusUpdateDialog } from './StatusUpdateDialog';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Instagram,
  Facebook,
  Music,
  Heart,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Edit,
  ArrowLeft,
  Download,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import { SOCIAL_MEDIA_LEVELS } from '@/lib/config/agent-application-form';
import Link from 'next/link';

interface ApplicationDetailProps {
  application: AgentApplicationWithRelations;
  onStatusUpdate: () => void;
}

export function ApplicationDetail({
  application,
  onStatusUpdate,
}: ApplicationDetailProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-700';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />;
      case 'SUBMITTED':
        return <Clock className="w-4 h-4" />;
      case 'UNDER_REVIEW':
        return <AlertTriangle className="w-4 h-4" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) {
      return '-';
    }
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ms });
    } catch {
      return '-';
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(
        `/api/admin/agent-applications/${application.id}/export-pdf`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `application-${application.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export PDF error:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch(
        `/api/admin/agent-applications/${application.id}/send-email`,
        {
          method: 'POST',
        }
      );
      if (response.ok) {
        alert('Email berjaya dihantar');
      }
    } catch (error) {
      console.error('Send email error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/admin/agents/applications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Permohonan {application.fullName}
            </h1>
            <p className="text-gray-600">ID: {application.id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Send className="w-4 h-4 mr-2" />
            Hantar Email
          </Button>
          <Button onClick={() => setShowStatusDialog(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Kemaskini Status
          </Button>
        </div>
      </div>

      {/* Status and Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {application.fullName}
                </h2>
                <p className="text-gray-600">{application.email}</p>
                <p className="text-gray-600">{application.phoneNumber}</p>
              </div>
            </div>

            <div className="text-right">
              <Badge className={`mb-2 ${getStatusColor(application.status)}`}>
                {getStatusIcon(application.status)}
                <span className="ml-2">{application.status}</span>
              </Badge>
              <div className="text-sm text-gray-600">
                <p>Dihantar: {formatDate(application.submittedAt)}</p>
                {application.reviewedAt && (
                  <p>Disemak: {formatDate(application.reviewedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Maklumat Peribadi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nama Penuh:</span>
                <span className="font-medium">{application.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No. Kad Pengenalan:</span>
                <span className="font-medium">{application.icNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Umur:</span>
                <span className="font-medium">{application.age} tahun</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No. Telefon:</span>
                <span className="font-medium">{application.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{application.email}</span>
              </div>
            </div>
            <Separator />
            <div>
              <span className="text-gray-600">Alamat:</span>
              <p className="font-medium mt-1">{application.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Business Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-green-600" />
              <span>Pengalaman Perniagaan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pengalaman Perniagaan:</span>
              <Badge
                variant={application.hasBusinessExp ? 'default' : 'outline'}
              >
                {application.hasBusinessExp ? 'Ya' : 'Tidak'}
              </Badge>
            </div>

            {application.hasBusinessExp && application.businessLocation && (
              <div className="flex justify-between">
                <span className="text-gray-600">Lokasi Perniagaan:</span>
                <span className="font-medium">
                  {application.businessLocation}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Pengalaman Memimpin Pasukan:
              </span>
              <Badge
                variant={application.hasTeamLeadExp ? 'default' : 'outline'}
              >
                {application.hasTeamLeadExp ? 'Ya' : 'Tidak'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Perniagaan Berdaftar:</span>
              <Badge variant={application.isRegistered ? 'default' : 'outline'}>
                {application.isRegistered ? 'Ya' : 'Tidak'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Instagram className="w-5 h-5 text-pink-600" />
              <span>Media Sosial</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Instagram */}
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Instagram className="w-5 h-5 text-pink-600" />
                <div>
                  <p className="font-medium">Instagram</p>
                  <p className="text-sm text-gray-600">
                    {application.instagramHandle
                      ? `@${application.instagramHandle}`
                      : 'Tidak dinyatakan'}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {SOCIAL_MEDIA_LEVELS[application.instagramLevel]}
              </Badge>
            </div>

            {/* Facebook */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Facebook className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Facebook</p>
                  <p className="text-sm text-gray-600">
                    {application.facebookHandle || 'Tidak dinyatakan'}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {SOCIAL_MEDIA_LEVELS[application.facebookLevel]}
              </Badge>
            </div>

            {/* TikTok */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Music className="w-5 h-5 text-gray-900" />
                <div>
                  <p className="font-medium">TikTok</p>
                  <p className="text-sm text-gray-600">
                    {application.tiktokHandle
                      ? `@${application.tiktokHandle}`
                      : 'Tidak dinyatakan'}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {SOCIAL_MEDIA_LEVELS[application.tiktokLevel]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span>Maklumat Tambahan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Pengalaman dengan Produk JRM:
              </span>
              <Badge variant={application.hasJrmExp ? 'default' : 'outline'}>
                {application.hasJrmExp ? 'Ya' : 'Tidak'}
              </Badge>
            </div>

            {application.hasJrmExp && application.jrmProducts && (
              <div>
                <span className="text-gray-600">
                  Produk JRM yang Digunakan:
                </span>
                <p className="font-medium mt-1 p-3 bg-yellow-50 rounded-lg text-sm">
                  {application.jrmProducts}
                </p>
              </div>
            )}

            <div>
              <span className="text-gray-600">Sebab Ingin Menyertai JRM:</span>
              <p className="font-medium mt-1 p-3 bg-blue-50 rounded-lg text-sm">
                {application.reasonToJoin}
              </p>
            </div>

            <div>
              <span className="text-gray-600">Jangkaan sebagai Ejen JRM:</span>
              <p className="font-medium mt-1 p-3 bg-green-50 rounded-lg text-sm">
                {application.expectations}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Notes and Reviews */}
      {(application.adminNotes ||
        (application.reviews && application.reviews.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Nota Admin & Sejarah Semakan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.adminNotes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">
                  Nota Admin Terkini
                </h4>
                <p className="text-yellow-800 text-sm">
                  {application.adminNotes}
                </p>
              </div>
            )}

            {application.reviews && application.reviews.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Sejarah Semakan ({application.reviews.length})
                </h4>
                <div className="space-y-3">
                  {application.reviews.map(review => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {review.reviewer?.name || 'Admin'}
                          </span>
                          <Badge
                            variant={
                              review.decision === 'APPROVED'
                                ? 'default'
                                : review.decision === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {review.decision}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.notes && (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                          {review.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        application={application}
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  );
}
