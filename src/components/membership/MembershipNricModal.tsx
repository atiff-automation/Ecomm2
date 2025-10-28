'use client';

/**
 * MembershipNricModal Component
 * Modal dialog for NRIC collection during membership activation
 *
 * @CLAUDE.md Compliance:
 * - Type Safety: Explicit TypeScript types, no `any`
 * - CSRF Protection: Uses fetchWithCSRF for mutations
 * - Three-Layer Validation: Frontend → API → Database
 * - DRY: Reuses validation utilities from /lib/validation/nric
 * - KISS: Simple single-purpose modal
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Crown, AlertTriangle } from 'lucide-react';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { validateNRIC, NRIC_VALIDATION_RULES } from '@/lib/validation/nric';

interface MembershipNricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nric: string) => void;
  onOptOut: () => void;
}

export default function MembershipNricModal({
  isOpen,
  onClose,
  onSuccess,
  onOptOut,
}: MembershipNricModalProps) {
  // NRIC form state
  const [nric, setNric] = useState('');
  const [nricError, setNricError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation dialogs state
  const [showNricConfirmDialog, setShowNricConfirmDialog] = useState(false);
  const [showOptOutConfirmDialog, setShowOptOutConfirmDialog] = useState(false);

  // NRIC input handler with validation
  const handleNricChange = (value: string) => {
    // Sanitize: Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    setNric(cleaned);
    setNricError('');

    // Validate when complete
    if (cleaned.length === 12) {
      const validation = validateNRIC(cleaned);
      if (!validation.valid) {
        setNricError(validation.error || '');
      }
    }
  };

  // Handle NRIC submission
  const handleSubmitNric = async () => {
    setShowNricConfirmDialog(false);
    setIsSubmitting(true);

    try {
      // ✅ CSRF PROTECTION - Use fetchWithCSRF for mutation
      const response = await fetchWithCSRF('/api/membership/nric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nric }),
      });

      if (response.ok) {
        // Success - notify parent and close modal
        onSuccess(nric);
        resetForm();
      } else {
        const data = await response.json();
        if (data.code === 'DUPLICATE_NRIC') {
          setNricError(NRIC_VALIDATION_RULES.ERROR_MESSAGES.DUPLICATE);
        } else {
          setNricError('Failed to validate NRIC. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting NRIC:', error);
      setNricError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opt-out
  const handleOptOut = () => {
    setShowOptOutConfirmDialog(false);
    resetForm();
    onOptOut();
  };

  // Reset form state
  const resetForm = () => {
    setNric('');
    setNricError('');
    setIsSubmitting(false);
  };

  return (
    <>
      {/* Main NRIC Modal */}
      <Dialog open={isOpen} onOpenChange={() => {}}>
        {/* Modal cannot be closed by clicking outside - user must make a choice */}
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              <DialogTitle>One More Step - Enter Your NRIC</DialogTitle>
            </div>
            <DialogDescription>
              Your NRIC will serve as your permanent Member ID and unlock exclusive benefits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* NRIC Input */}
            <div>
              <Label htmlFor="nric-modal" className="text-sm font-medium">
                NRIC Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nric-modal"
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={nric}
                onChange={(e) => handleNricChange(e.target.value)}
                placeholder="e.g. 900101015678"
                className={`mt-1 font-mono text-lg ${nricError ? 'border-red-300' : ''}`}
                disabled={isSubmitting}
              />
              {nricError && (
                <p className="text-sm text-red-600 mt-1">{nricError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                12 digits, no dashes or symbols
              </p>
            </div>

            {/* Preview */}
            {nric.length === 12 && !nricError && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 mb-1">Your Member ID will be:</p>
                <p className="text-2xl font-mono font-bold text-purple-900">{nric}</p>
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Cannot be changed after submission
                </p>
              </div>
            )}

            {/* Primary Button */}
            <Button
              onClick={() => setShowNricConfirmDialog(true)}
              disabled={nric.length !== 12 || !!nricError || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Processing...' : 'Complete Membership'}
            </Button>

            {/* Secondary Option - Opt Out */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowOptOutConfirmDialog(true)}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Proceed Without Membership
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NRIC Confirmation Dialog */}
      <Dialog open={showNricConfirmDialog} onOpenChange={setShowNricConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Confirm Your NRIC Number</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>Please verify that your NRIC is correct:</p>
              <div className="bg-purple-50 p-4 rounded border-2 border-purple-300">
                <p className="text-sm text-purple-700 mb-1">Member ID:</p>
                <p className="text-3xl font-mono font-bold text-purple-900">{nric}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⚠️ Important:
                </p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• This NRIC cannot be changed after submission</li>
                  <li>• It will be your permanent Member ID</li>
                  <li>• Corrections require contacting support</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNricConfirmDialog(false)}>
              Let Me Check Again
            </Button>
            <Button onClick={handleSubmitNric}>
              Yes, This is Correct
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opt-Out Confirmation Dialog */}
      <Dialog open={showOptOutConfirmDialog} onOpenChange={setShowOptOutConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Proceed Without Membership?</DialogTitle>
            <DialogDescription className="space-y-3">
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <p className="text-sm text-red-800 font-semibold mb-2">
                  Are you sure? You'll miss out on:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Member pricing on all products</li>
                  <li>• Exclusive member-only deals</li>
                  <li>• Early access to new products</li>
                  <li>• Special promotions and offers</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                To activate membership later, please contact us.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptOutConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOptOut}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Proceed Without
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
