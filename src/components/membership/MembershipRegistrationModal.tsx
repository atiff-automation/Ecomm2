'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Crown, Star, Gift, Sparkles } from 'lucide-react';
import { z } from 'zod';

interface MembershipEligibility {
  eligible: boolean;
  qualifyingTotal: number;
  threshold: number;
  remaining: number;
  message: string;
  qualifyingItems: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

interface MembershipRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (membershipData: any) => void;
  eligibility: MembershipEligibility;
  cartItems: Array<{ productId: string; quantity: number }>;
}

const registrationSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    acceptTerms: z
      .boolean()
      .refine(val => val === true, 'You must accept the terms and conditions'),
    acceptMarketing: z.boolean().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function MembershipRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  eligibility,
  cartItems,
}: MembershipRegistrationModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<'benefits' | 'register' | 'login'>(
    'benefits'
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
    acceptMarketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    try {
      const validatedData = registrationSchema.parse(formData);
      setLoading(true);
      setErrors({});

      const response = await fetchWithCSRF('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validatedData,
          cartItems,
          registerAsMember: true,
          qualifyingAmount: eligibility.qualifyingTotal,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const errorMap: Record<string, string> = {};
          result.errors.forEach((error: any) => {
            errorMap[error.field] = error.message;
          });
          setErrors(errorMap);
        } else {
          setErrors({ submit: result.message || 'Registration failed' });
        }
        return;
      }

      // Auto-login the new user
      const loginResult = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (loginResult?.ok) {
        // Transfer guest cart to user account after successful login
        try {
          const transferResponse = await fetch(
            '/api/cart/transfer-guest-cart',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }
          );

          if (!transferResponse.ok) {
            console.warn('Failed to transfer guest cart to user account');
          }
        } catch (error) {
          console.warn('Error transferring guest cart:', error);
        }

        // Show success with pending status
        onSuccess({
          ...result,
          membershipStatus: 'pending_payment',
          message:
            'Account created! Your membership will be activated after successful payment.',
        });

        // Ensure user stays on checkout page after registration
        if (
          typeof window !== 'undefined' &&
          window.location.pathname === '/checkout'
        ) {
          // Stay on checkout page - don't navigate away
          window.history.replaceState(null, '', '/checkout');
        }

        onClose();
      } else {
        setErrors({
          submit:
            'Registration successful, but login failed. Please try logging in manually.',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.issues.forEach(err => {
          errorMap[err.path.join('.')] = err.message;
        });
        setErrors(errorMap);
      } else {
        setErrors({ submit: 'An unexpected error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrors({});

      const result = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (result?.ok) {
        // Transfer guest cart to user account after successful login
        try {
          const transferResponse = await fetch(
            '/api/cart/transfer-guest-cart',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }
          );

          if (!transferResponse.ok) {
            console.warn('Failed to transfer guest cart to user account');
          }
        } catch (error) {
          console.warn('Error transferring guest cart:', error);
        }

        // For checkout flow, don't activate membership immediately
        // Instead, signal that membership will be pending until payment
        if (
          typeof window !== 'undefined' &&
          window.location.pathname === '/checkout'
        ) {
          console.log(
            '🔄 Checkout flow: Membership will be pending until payment completion'
          );

          onSuccess({
            message:
              'Account created! Your membership will be activated after successful payment.',
            membershipStatus: 'pending_payment',
            membership: {
              isActive: false,
              pendingPayment: true,
              qualifyingAmount: eligibility.qualifyingTotal,
            },
          });

          // Stay on checkout page - don't navigate away
          window.history.replaceState(null, '', '/checkout');
          onClose();
        } else {
          // 🔒 SECURITY FIX: Do NOT activate membership immediately
          // All flows (checkout and non-checkout) must go through payment first
          // Membership activation ONLY happens after payment success

          // Confirm registration intent (for audit trail)
          await fetchWithCSRF('/api/membership/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              acceptTerms: true,
              qualifyingAmount: eligibility.qualifyingTotal,
            }),
          });

          // Return pending status - membership requires payment completion
          onSuccess({
            membershipStatus: 'pending_payment',
            membership: {
              isActive: false,
              pendingPayment: true,
              qualifyingAmount: eligibility.qualifyingTotal,
            },
          });

          onClose();
        }
      } else {
        setErrors({ submit: 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  if (!eligibility.eligible) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {step === 'benefits' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Crown className="h-6 w-6 text-yellow-500" />
                Congratulations! You Qualify for Membership
              </DialogTitle>
              <DialogDescription>
                You're eligible to become a member with{' '}
                {formatCurrency(eligibility.qualifyingTotal)} in qualifying
                purchases!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Qualification Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    You Qualify!
                  </span>
                </div>
                <p className="text-green-700 text-sm">
                  Your cart contains{' '}
                  {formatCurrency(eligibility.qualifyingTotal)} in eligible
                  products (minimum: {formatCurrency(eligibility.threshold)})
                </p>
              </div>

              {/* Member Benefits */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Member Benefits You'll Enjoy:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      Exclusive member pricing on all products
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">
                      Early access to new products and sales
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      Special member-only promotions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Priority customer support</span>
                  </div>
                </div>
              </div>

              {/* Qualifying Items */}
              {eligibility.qualifyingItems.length > 0 && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Qualifying Items:
                  </h4>
                  <div className="space-y-1">
                    {eligibility.qualifyingItems
                      .slice(0, 3)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="truncate">
                            {item.name} (×{item.quantity})
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    {eligibility.qualifyingItems.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{eligibility.qualifyingItems.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {session?.user ? (
                  <Button
                    onClick={() => handleLogin()}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading
                      ? 'Activating Membership...'
                      : 'Activate My Membership'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setStep('register')}
                      className="w-full"
                    >
                      Create New Account & Join
                    </Button>
                    <Button
                      onClick={() => setStep('login')}
                      variant="outline"
                      className="w-full"
                    >
                      I Have an Account
                    </Button>
                  </>
                )}
                <Button onClick={onClose} variant="ghost" className="w-full">
                  Continue Without Membership
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'register' && (
          <>
            <DialogHeader>
              <DialogTitle>Create Your Member Account</DialogTitle>
              <DialogDescription>
                Join now to unlock member benefits and exclusive pricing!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={e =>
                      handleInputChange('firstName', e.target.value)
                    }
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e =>
                      handleInputChange('lastName', e.target.value)
                    }
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="+60123456789"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={checked =>
                      handleInputChange('acceptTerms', !!checked)
                    }
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    I accept the{' '}
                    <span className="text-blue-600 underline cursor-pointer">
                      Terms and Conditions
                    </span>{' '}
                    *
                  </Label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-red-500 text-xs">{errors.acceptTerms}</p>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptMarketing"
                    checked={formData.acceptMarketing}
                    onCheckedChange={checked =>
                      handleInputChange('acceptMarketing', !!checked)
                    }
                  />
                  <Label htmlFor="acceptMarketing" className="text-sm">
                    I want to receive promotional emails and offers
                  </Label>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating Account...' : 'Create Account & Join'}
                </Button>
                <Button
                  onClick={() => setStep('benefits')}
                  variant="outline"
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'login' && (
          <>
            <DialogHeader>
              <DialogTitle>Sign In to Activate Membership</DialogTitle>
              <DialogDescription>
                Sign in to your existing account to activate your membership
                benefits.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="loginEmail">Email</Label>
                <Input
                  id="loginEmail"
                  type="email"
                  value={loginData.email}
                  onChange={e =>
                    handleLoginInputChange('email', e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="loginPassword">Password</Label>
                <PasswordInput
                  id="loginPassword"
                  value={loginData.password}
                  onChange={e =>
                    handleLoginInputChange('password', e.target.value)
                  }
                />
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Signing In...' : 'Sign In & Activate Membership'}
                </Button>
                <Button
                  onClick={() => setStep('benefits')}
                  variant="outline"
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
