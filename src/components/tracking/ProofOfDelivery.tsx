/**
 * Proof of Delivery Component
 * Displays delivery confirmation including signature and photo proof
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.2
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  User,
  Camera,
  FileSignature,
  Download,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface DeliveryProof {
  deliveredAt: string;
  receivedBy: string;
  receiverName?: string;
  receiverRelationship?: string; // 'SELF' | 'FAMILY' | 'NEIGHBOR' | 'OFFICE_STAFF' | 'OTHER'
  signatureImage?: string;
  deliveryPhoto?: string;
  deliveryNotes?: string;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  courierName?: string;
  courierPhone?: string;
  verificationMethod?: 'SIGNATURE' | 'PHOTO' | 'OTP' | 'ID_CHECK';
}

interface ProofOfDeliveryProps {
  trackingNumber: string;
  deliveryProof?: DeliveryProof;
  customerName?: string;
  deliveryAddress?: string;
  className?: string;
}

export default function ProofOfDelivery({
  trackingNumber,
  deliveryProof,
  customerName,
  deliveryAddress,
  className = '',
}: ProofOfDeliveryProps) {
  const [imageLoading, setImageLoading] = useState<string | null>(null);
  const [showFullSignature, setShowFullSignature] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  // Format timestamp for Malaysian timezone
  const formatDate = (dateString: string, includeTime = true) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      }),
    };
    return date.toLocaleDateString('en-MY', options);
  };

  // Get receiver relationship display
  const getReceiverRelationshipDisplay = (relationship?: string) => {
    const relationships = {
      SELF: 'Received by customer',
      FAMILY: 'Received by family member',
      NEIGHBOR: 'Received by neighbor',
      OFFICE_STAFF: 'Received by office staff',
      OTHER: 'Received by authorized person',
    };
    return (
      relationships[relationship as keyof typeof relationships] ||
      'Received by recipient'
    );
  };

  // Get verification method display
  const getVerificationMethodDisplay = (method?: string) => {
    const methods = {
      SIGNATURE: 'Digital signature',
      PHOTO: 'Photo confirmation',
      OTP: 'OTP verification',
      ID_CHECK: 'ID verification',
    };
    return methods[method as keyof typeof methods] || 'Standard verification';
  };

  // Handle image download
  const handleImageDownload = async (imageUrl: string, filename: string) => {
    setImageLoading(filename);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${trackingNumber}-${filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    } finally {
      setImageLoading(null);
    }
  };

  if (!deliveryProof) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5" />
            Proof of Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Proof of delivery will be available once your package has been
              delivered.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Delivery Confirmation Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Delivery Confirmed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Delivery Summary */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      DELIVERED
                    </Badge>
                    <span className="text-sm text-green-700">
                      {formatDate(deliveryProof.deliveredAt)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" />
                      <span>
                        {getReceiverRelationshipDisplay(
                          deliveryProof.receiverRelationship
                        )}
                        {deliveryProof.receiverName &&
                          `: ${deliveryProof.receiverName}`}
                      </span>
                    </div>

                    {deliveryAddress && (
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>{deliveryAddress}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {getVerificationMethodDisplay(
                          deliveryProof.verificationMethod
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {deliveryProof.locationCoordinates && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://maps.google.com/?q=${deliveryProof.locationCoordinates.latitude},${deliveryProof.locationCoordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Location
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Delivery Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="font-medium">{trackingNumber}</p>
              </div>

              {customerName && (
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium">{customerName}</p>
                </div>
              )}

              {deliveryProof.courierName && (
                <div>
                  <p className="text-sm text-gray-600">Delivered By</p>
                  <p className="font-medium">{deliveryProof.courierName}</p>
                  {deliveryProof.courierPhone && (
                    <p className="text-xs text-gray-500">
                      {deliveryProof.courierPhone}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Delivery Time</p>
                <p className="font-medium">
                  {formatDate(deliveryProof.deliveredAt)}
                </p>
              </div>
            </div>

            {/* Delivery Notes */}
            {deliveryProof.deliveryNotes && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Delivery Notes</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm italic">
                    "{deliveryProof.deliveryNotes}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Proof */}
      {deliveryProof.signatureImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Digital Signature
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleImageDownload(
                    deliveryProof.signatureImage!,
                    'signature.png'
                  )
                }
                disabled={imageLoading === 'signature.png'}
              >
                <Download className="w-4 h-4 mr-2" />
                {imageLoading === 'signature.png'
                  ? 'Downloading...'
                  : 'Download'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div
                  className={`inline-block border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white cursor-pointer transition-all ${
                    showFullSignature
                      ? 'border-blue-500'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setShowFullSignature(!showFullSignature)}
                >
                  <img
                    src={deliveryProof.signatureImage}
                    alt="Delivery signature"
                    className={`transition-all ${
                      showFullSignature
                        ? 'max-w-full max-h-96'
                        : 'max-w-xs max-h-32'
                    }`}
                    onLoad={() => setImageLoading(null)}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {showFullSignature
                    ? 'Click to minimize'
                    : 'Click to view full size'}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Signed by:{' '}
                  <span className="font-medium">
                    {deliveryProof.receivedBy}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Digital signature captured at delivery
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Proof */}
      {deliveryProof.deliveryPhoto && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Delivery Photo
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleImageDownload(
                    deliveryProof.deliveryPhoto!,
                    'delivery-photo.jpg'
                  )
                }
                disabled={imageLoading === 'delivery-photo.jpg'}
              >
                <Download className="w-4 h-4 mr-2" />
                {imageLoading === 'delivery-photo.jpg'
                  ? 'Downloading...'
                  : 'Download'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div
                  className={`inline-block border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white cursor-pointer transition-all ${
                    showFullPhoto ? 'border-blue-500' : 'hover:border-gray-400'
                  }`}
                  onClick={() => setShowFullPhoto(!showFullPhoto)}
                >
                  <img
                    src={deliveryProof.deliveryPhoto}
                    alt="Delivery photo"
                    className={`transition-all rounded ${
                      showFullPhoto
                        ? 'max-w-full max-h-96'
                        : 'max-w-xs max-h-48'
                    }`}
                    onLoad={() => setImageLoading(null)}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {showFullPhoto
                    ? 'Click to minimize'
                    : 'Click to view full size'}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Photo taken at delivery location
                </p>
                <p className="text-xs text-gray-500">
                  Timestamp: {formatDate(deliveryProof.deliveredAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Delivery Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                This delivery has been verified and confirmed using{' '}
                <span className="font-medium">
                  {getVerificationMethodDisplay(
                    deliveryProof.verificationMethod
                  )}
                </span>
                . The proof of delivery documents above serve as official
                confirmation that your package was successfully delivered.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>
                  Delivered: {formatDate(deliveryProof.deliveredAt, false)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>
                  Time:{' '}
                  {new Date(deliveryProof.deliveredAt).toLocaleTimeString(
                    'en-MY',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Asia/Kuala_Lumpur',
                    }
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span>Received by: {deliveryProof.receivedBy}</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span>
                  Verification:{' '}
                  {getVerificationMethodDisplay(
                    deliveryProof.verificationMethod
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
