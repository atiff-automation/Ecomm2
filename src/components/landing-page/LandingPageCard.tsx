/**
 * Landing Page Card Component
 * Displays landing page preview in list views
 */

import Link from 'next/link';
import { LandingPageListItem } from '@/types/landing-page.types';
import { formatDistanceToNow } from 'date-fns';

interface LandingPageCardProps {
  landingPage: LandingPageListItem;
}

export function LandingPageCard({ landingPage }: LandingPageCardProps) {
  return (
    <Link
      href={`/landing/${landingPage.slug}`}
      className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-video relative bg-gray-100">
        <img
          src={landingPage.featuredImage}
          alt={landingPage.featuredImageAlt}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(landingPage.publishedAt), { addSuffix: true })}
          </span>
        </div>
        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
          {landingPage.title}
        </h3>
        {landingPage.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {landingPage.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

export default LandingPageCard;
