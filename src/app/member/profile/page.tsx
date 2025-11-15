/**
 * Member Profile Page - Malaysian E-commerce Platform
 * Refactored following @CLAUDE.md principles
 * - Single Source of Truth (constants, no hardcoding)
 * - DRY (reusable components)
 * - Type Safety (no 'any' types)
 * - KISS (simple, focused layout)
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Award,
  Edit,
  Save,
  X,
  Gift,
  Lock,
  Star,
} from 'lucide-react';
import { ChangePasswordForm } from '@/components/member/ChangePasswordForm';
import { PageHeader } from '@/components/member/PageHeader';
import { SectionCard } from '@/components/member/SectionCard';
import { StatsSummaryCard } from '@/components/member/StatsSummaryCard';
import { SecuritySection } from '@/components/member/SecuritySection';
import { MemberBenefitsCard } from '@/components/member/MemberBenefitsCard';
import { MemberStats, UserProfile, StatItem, BenefitItem } from '@/types/member';
import { LAYOUT_CONSTANTS, GRID_CONFIGS } from '@/lib/constants/layout';
import { THEME_CONSTANTS } from '@/lib/constants/theme';
import { MEMBER_PAGE_TEXT, MEMBER_MESSAGES } from '@/lib/constants/member-text';

export default function MemberProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
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

    fetchMemberData();
  }, [session, status, router]);

  const fetchMemberData = async () => {
    try {
      const [statsResponse, profileResponse] = await Promise.all([
        fetch('/api/member/stats'),
        fetch('/api/member/profile'),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMemberStats(statsData.stats);
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData.profile);
        setEditedProfile(profileData.profile);
      }
    } catch (error) {
      console.error('Failed to fetch member data:', error);
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
        alert(MEMBER_MESSAGES.ERROR.PROFILE_UPDATE_FAILED);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert(MEMBER_MESSAGES.ERROR.PROFILE_UPDATE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Prepare stats for StatsSummaryCard
  const stats: StatItem[] | undefined = memberStats
    ? [
        {
          label: MEMBER_PAGE_TEXT.STATS.TOTAL_SAVINGS,
          value: formatPrice(memberStats.totalSavings),
          valueColor: 'text-green-600',
        },
        {
          label: MEMBER_PAGE_TEXT.STATS.TOTAL_ORDERS,
          value: memberStats.totalOrders,
        },
        {
          label: MEMBER_PAGE_TEXT.STATS.TOTAL_SPENT,
          value: formatPrice(memberStats.totalSpent),
        },
        {
          label: MEMBER_PAGE_TEXT.STATS.AVG_ORDER,
          value: formatPrice(memberStats.averageOrderValue),
        },
      ]
    : undefined;

  // Prepare benefits for MemberBenefitsCard
  const benefits: BenefitItem[] = [
    {
      icon: Gift,
      title: MEMBER_PAGE_TEXT.BENEFITS_CONTENT.EXCLUSIVE_PRICING.TITLE,
      description:
        MEMBER_PAGE_TEXT.BENEFITS_CONTENT.EXCLUSIVE_PRICING.DESCRIPTION,
      backgroundColor: THEME_CONSTANTS.BENEFITS.PRICING.BACKGROUND,
      textColor: THEME_CONSTANTS.BENEFITS.PRICING.TEXT,
      descriptionColor: THEME_CONSTANTS.BENEFITS.PRICING.DESCRIPTION,
    },
    {
      icon: Award,
      title: MEMBER_PAGE_TEXT.BENEFITS_CONTENT.PRIORITY_SUPPORT.TITLE,
      description:
        MEMBER_PAGE_TEXT.BENEFITS_CONTENT.PRIORITY_SUPPORT.DESCRIPTION,
      backgroundColor: THEME_CONSTANTS.BENEFITS.SUPPORT.BACKGROUND,
      textColor: THEME_CONSTANTS.BENEFITS.SUPPORT.TEXT,
      descriptionColor: THEME_CONSTANTS.BENEFITS.SUPPORT.DESCRIPTION,
    },
    {
      icon: Star,
      title: MEMBER_PAGE_TEXT.BENEFITS_CONTENT.EARLY_ACCESS.TITLE,
      description:
        MEMBER_PAGE_TEXT.BENEFITS_CONTENT.EARLY_ACCESS.DESCRIPTION,
      backgroundColor: THEME_CONSTANTS.BENEFITS.EARLY_ACCESS.BACKGROUND,
      textColor: THEME_CONSTANTS.BENEFITS.EARLY_ACCESS.TEXT,
      descriptionColor: THEME_CONSTANTS.BENEFITS.EARLY_ACCESS.DESCRIPTION,
    },
  ];

  return (
    <div
      className={`${LAYOUT_CONSTANTS.MEMBER.MAX_WIDTH} mx-auto ${LAYOUT_CONSTANTS.MEMBER.PADDING}`}
    >
      {/* Page Header */}
      <PageHeader
        icon={User}
        title={
          userProfile
            ? MEMBER_PAGE_TEXT.PROFILE.WELCOME(userProfile.firstName)
            : MEMBER_PAGE_TEXT.PROFILE.TITLE
        }
        description={MEMBER_PAGE_TEXT.PROFILE.DESCRIPTION}
        badge={
          session?.user?.isMember
            ? {
                text: MEMBER_PAGE_TEXT.STATUS.MEMBER,
                variant: 'member',
              }
            : {
                text: MEMBER_PAGE_TEXT.STATUS.REGULAR,
                variant: 'regular',
              }
        }
        additionalInfo={
          session?.user?.isMember && memberStats?.memberSince
            ? MEMBER_PAGE_TEXT.STATUS.MEMBER_SINCE(
                formatDate(memberStats.memberSince)
              )
            : undefined
        }
      />

      {/* Vertical Card Stack */}
      <div className={LAYOUT_CONSTANTS.MEMBER.SPACING}>
        {/* Member Stats Summary - Only for Members */}
        {session?.user?.isMember && stats && (
          <StatsSummaryCard stats={stats} />
        )}

        {/* Profile Information Section */}
        <SectionCard
          icon={User}
          title={MEMBER_PAGE_TEXT.SECTIONS.PROFILE_INFO.TITLE}
          headerAction={
            !isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {MEMBER_PAGE_TEXT.ACTIONS.EDIT_PROFILE}
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
                <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving
                    ? MEMBER_PAGE_TEXT.ACTIONS.SAVING
                    : MEMBER_PAGE_TEXT.ACTIONS.SAVE_CHANGES}
                </Button>
              </div>
            )
          }
        >
          {userProfile && editedProfile && (
            <div className={`${GRID_CONFIGS.FORM_TWO_COLS} gap-6`}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">
                    {MEMBER_PAGE_TEXT.FIELDS.FIRST_NAME}
                  </Label>
                  <Input
                    id="firstName"
                    value={editedProfile.firstName}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        firstName: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">
                    {MEMBER_PAGE_TEXT.FIELDS.LAST_NAME}
                  </Label>
                  <Input
                    id="lastName"
                    value={editedProfile.lastName}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        lastName: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    {MEMBER_PAGE_TEXT.FIELDS.EMAIL}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) =>
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
                  <Label htmlFor="phone">
                    {MEMBER_PAGE_TEXT.FIELDS.PHONE}
                  </Label>
                  <Input
                    id="phone"
                    value={editedProfile.phone || ''}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        phone: e.target.value,
                      })
                    }
                    placeholder={MEMBER_PAGE_TEXT.PLACEHOLDERS.PHONE}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">
                    {MEMBER_PAGE_TEXT.FIELDS.DATE_OF_BIRTH}
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={editedProfile.dateOfBirth || ''}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        dateOfBirth: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>{MEMBER_PAGE_TEXT.FIELDS.MEMBER_STATUS}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {session?.user?.isMember ? (
                      <>
                        <Badge className={THEME_CONSTANTS.BADGES.MEMBER}>
                          <Award className="w-3 h-3 mr-1" />
                          {MEMBER_PAGE_TEXT.STATUS.MEMBER}
                        </Badge>
                        {memberStats?.memberSince && (
                          <span className="text-sm text-gray-600">
                            {MEMBER_PAGE_TEXT.STATUS.ACTIVE_SINCE(
                              formatDate(memberStats.memberSince)
                            )}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className={THEME_CONSTANTS.BADGES.REGULAR}
                      >
                        {MEMBER_PAGE_TEXT.STATUS.REGULAR}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Member ID - Only show for members */}
                {session?.user?.isMember && userProfile?.nric && (
                  <div>
                    <Label>{MEMBER_PAGE_TEXT.FIELDS.MEMBER_ID}</Label>
                    <div className="mt-1">
                      <div className="text-lg font-semibold text-purple-600 font-mono tracking-tight break-all">
                        {userProfile.nric}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {MEMBER_PAGE_TEXT.STATUS.NRIC_LABEL}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Security Settings Section (Collapsible) */}
        <SecuritySection
          items={[
            {
              id: 'password',
              icon: Lock,
              title: MEMBER_PAGE_TEXT.PASSWORD.SECTION_TITLE,
              description: MEMBER_PAGE_TEXT.PASSWORD.SECTION_DESCRIPTION,
              content: <ChangePasswordForm />,
            },
          ]}
        />

        {/* Member Benefits Section - Only for Members */}
        {session?.user?.isMember && (
          <MemberBenefitsCard
            benefits={benefits}
            memberStats={memberStats}
            formatPrice={formatPrice}
          />
        )}
      </div>
    </div>
  );
}
