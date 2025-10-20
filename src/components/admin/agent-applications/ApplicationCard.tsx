/**
 * Application Card Component
 * Individual application card for listing display
 * Following CLAUDE.md principles: Reusable, systematic implementation
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AgentApplicationStatus } from '@prisma/client';
import { AgentApplicationWithRelations } from '@/types/agent-application';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusUpdateDialog } from './StatusUpdateDialog';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';

interface ApplicationCardProps {
  application: AgentApplicationWithRelations;
  onStatusUpdate: () => void;
}

export function ApplicationCard({
  application,
  onStatusUpdate,
}: ApplicationCardProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const getStatusColor = (status: AgentApplicationStatus) => {
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

  const getStatusIcon = (status: AgentApplicationStatus) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-3 h-3" />;
      case 'SUBMITTED':
        return <Clock className="w-3 h-3" />;
      case 'UNDER_REVIEW':
        return <AlertTriangle className="w-3 h-3" />;
      case 'APPROVED':
        return <CheckCircle className="w-3 h-3" />;
      case 'REJECTED':
        return <XCircle className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status: AgentApplicationStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Dihantar';
      case 'UNDER_REVIEW':
        return 'Dalam Semakan';
      case 'APPROVED':
        return 'Diterima';
      case 'REJECTED':
        return 'Ditolak';
      default:
        return status;
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

  const getDaysAgo = (date: Date | null) => {
    if (!date) {
      return '';
    }
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '(1 hari lalu)';
    }
    if (diffDays <= 30) {
      return `(${diffDays} hari lalu)`;
    }
    if (diffDays <= 365) {
      const months = Math.floor(diffDays / 30);
      return `(${months} bulan lalu)`;
    }
    const years = Math.floor(diffDays / 365);
    return `(${years} tahun lalu)`;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Main Info */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {application.fullName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {application.id}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(application.status)}>
                  {getStatusIcon(application.status)}
                  <span className="ml-1">
                    {getStatusLabel(application.status)}
                  </span>
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{application.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{application.phoneNumber}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{application.icNumber}</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Umur: {application.age}</span>
                </div>

                {application.hasBusinessExp && (
                  <Badge variant="outline" className="text-xs">
                    Ada Pengalaman Perniagaan
                  </Badge>
                )}

                {application.hasJrmExp && (
                  <Badge variant="outline" className="text-xs">
                    Ada Pengalaman JRM
                  </Badge>
                )}

                {application.hasTeamLeadExp && (
                  <Badge variant="outline" className="text-xs">
                    Ada Pengalaman Memimpin
                  </Badge>
                )}
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                {application.submittedAt && (
                  <div>
                    <span className="font-medium">Dihantar: </span>
                    {formatDate(application.submittedAt)}{' '}
                    {getDaysAgo(application.submittedAt)}
                  </div>
                )}
                {application.reviewedAt && (
                  <div>
                    <span className="font-medium">Disemak: </span>
                    {formatDate(application.reviewedAt)}{' '}
                    {getDaysAgo(application.reviewedAt)}
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {application.adminNotes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Nota Admin: </span>
                    {application.adminNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex lg:flex-col items-center gap-2">
              <Link href={`/admin/agents/applications/${application.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full lg:w-auto"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat
                </Button>
              </Link>

              <Button
                variant="default"
                size="sm"
                onClick={() => setShowStatusDialog(true)}
                className="w-full lg:w-auto"
              >
                <Edit className="w-4 h-4 mr-2" />
                Kemaskini
              </Button>
            </div>
          </div>

          {/* Reviews Section */}
          {application.reviews && application.reviews.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-gray-900 mb-2">
                Sejarah Semakan ({application.reviews.length})
              </h4>
              <div className="space-y-2">
                {application.reviews.slice(0, 2).map((review, index) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded p-2"
                  >
                    <div>
                      <span className="font-medium">
                        {review.reviewer?.name || 'Admin'}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{review.decision}</span>
                      {review.notes && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="italic">"{review.notes}"</span>
                        </>
                      )}
                    </div>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                ))}
                {application.reviews.length > 2 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{application.reviews.length - 2} lagi...
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        application={application}
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        onStatusUpdate={onStatusUpdate}
      />
    </>
  );
}
