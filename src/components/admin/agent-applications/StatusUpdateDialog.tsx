/**
 * Status Update Dialog Component
 * Dialog for admin to update application status with notes
 * Following CLAUDE.md principles: Centralized form handling, systematic implementation
 */

'use client';

import React, { useState } from 'react';
import { AgentApplicationStatus, ApplicationDecision } from '@prisma/client';
import { AgentApplicationWithRelations } from '@/types/agent-application';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface StatusUpdateDialogProps {
  application: AgentApplicationWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: () => void;
}

export function StatusUpdateDialog({
  application,
  open,
  onOpenChange,
  onStatusUpdate,
}: StatusUpdateDialogProps) {
  const [status, setStatus] = useState<AgentApplicationStatus>(
    application.status
  );
  const [decision, setDecision] = useState<ApplicationDecision | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: 'SUBMITTED', label: 'Dihantar', icon: Clock, color: 'blue' },
    {
      value: 'UNDER_REVIEW',
      label: 'Dalam Semakan',
      icon: AlertTriangle,
      color: 'yellow',
    },
    { value: 'APPROVED', label: 'Diterima', icon: CheckCircle, color: 'green' },
    { value: 'REJECTED', label: 'Ditolak', icon: XCircle, color: 'red' },
  ];

  const decisionOptions = [
    { value: 'APPROVED', label: 'Diluluskan', color: 'green' },
    { value: 'REJECTED', label: 'Ditolak', color: 'red' },
    {
      value: 'NEEDS_MORE_INFO',
      label: 'Perlukan Maklumat Tambahan',
      color: 'yellow',
    },
  ];

  const handleSubmit = async () => {
    if (!status) {
      toast.error('Sila pilih status');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/agent-applications/${application.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            reviewerDecision: decision || undefined,
            adminNotes: notes || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal mengemaskini status');
      }

      toast.success('Status berjaya dikemaskini');
      onStatusUpdate();
      onOpenChange(false);

      // Reset form
      setStatus(application.status);
      setDecision('');
      setNotes('');
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Ralat sistem berlaku'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStatus(application.status);
    setDecision('');
    setNotes('');
  };

  const getStatusIcon = (statusValue: AgentApplicationStatus) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    if (!option) return null;
    const Icon = option.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusColor = (statusValue: AgentApplicationStatus) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option?.color || 'gray';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kemaskini Status Permohonan</DialogTitle>
          <DialogDescription>
            Kemaskini status dan tambah nota untuk permohonan{' '}
            {application.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <Label className="text-sm font-medium text-gray-700">
              Status Semasa
            </Label>
            <div className="mt-2">
              <Badge
                className={`bg-${getStatusColor(application.status)}-100 text-${getStatusColor(application.status)}-700`}
              >
                {getStatusIcon(application.status)}
                <span className="ml-2">
                  {statusOptions.find(opt => opt.value === application.status)
                    ?.label || application.status}
                </span>
              </Badge>
            </div>
            {application.adminNotes && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Nota sebelumnya: </span>
                {application.adminNotes}
              </div>
            )}
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Status Baru *</Label>
            <Select
              value={status}
              onValueChange={value =>
                setStatus(value as AgentApplicationStatus)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status baru" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Decision Selection (optional) */}
          <div className="space-y-2">
            <Label htmlFor="decision">Keputusan Semakan (Opsyenal)</Label>
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih keputusan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tiada keputusan</SelectItem>
                {decisionOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={`text-${option.color}-700`}>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Nota Admin</Label>
            <Textarea
              id="notes"
              placeholder="Tambah nota atau sebab untuk perubahan status..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Nota ini akan dihantar kepada pemohon melalui email dan disimpan
              dalam sistem
            </p>
          </div>

          {/* Application Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Ringkasan Permohonan
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div>Email: {application.email}</div>
              <div>Telefon: {application.phoneNumber}</div>
              <div>Umur: {application.age}</div>
              <div>IC: {application.icNumber}</div>
              <div>
                Pengalaman Perniagaan:{' '}
                {application.hasBusinessExp ? 'Ya' : 'Tidak'}
              </div>
              <div>
                Pengalaman JRM: {application.hasJrmExp ? 'Ya' : 'Tidak'}
              </div>
            </div>
          </div>

          {/* Warning for Status Changes */}
          {(status === 'APPROVED' || status === 'REJECTED') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Amaran</p>
                  <p>
                    {status === 'APPROVED'
                      ? 'Memluluskan permohonan ini akan menghantar email pengesahan kepada pemohon dan membolehkan mereka memulakan proses orientasi.'
                      : 'Menolak permohonan ini akan menghantar email penolakan kepada pemohon. Pastikan anda memberi sebab yang jelas dalam nota admin.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !status}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Kemaskini Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
