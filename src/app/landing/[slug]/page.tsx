/**
 * Single Landing Page
 * /landing/[slug]
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Share2,
  Facebook,
  Twitter,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import type { LandingPageWithRelations } from '@/types/landing-page.types';
import SEOHead from '@/components/seo/SEOHead';
import { ArticleContent } from '@/components/article/embeds/ArticleContent';
import { ArticleSchema } from '@/components/seo/ArticleSchema';
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';
import { ProductShowcase } from '@/components/landing-pages/ProductShowcase';

interface SingleLandingPageProps {
  params: { slug: string };
}

export default function SingleLandingPage({ params }: SingleLandingPageProps) {
  const router = useRouter();
  const [landingPage, setLandingPage] = useState<LandingPageWithRelations | null>(null);
  const [relatedLandingPages, setRelatedLandingPages] = useState<LandingPageWithRelations[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Initialize conversion tracking hook
  const { trackClick } = useLandingPageTracking(params.slug);

  useEffect(() => {
    fetchLandingPage();
  }, [params.slug]);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);

      // Fetch landing page
      const response = await fetch(`/api/public/landing-pages/${params.slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/landing');
          return;
        }
        throw new Error('Failed to fetch landing page');
      }

      const data = await response.json();
      setLandingPage(data.landingPage);
      setRelatedLandingPages(data.relatedLandingPages || []);

      // Fetch featured products if any
      if (data.landingPage.featuredProductIds && data.landingPage.featuredProductIds.length > 0) {
        const productsResponse = await fetch(
          `/api/admin/products/search?pageSize=50`
        );
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const featured = productsData.products.filter((p: any) =>
            data.landingPage.featuredProductIds.includes(p.id)
          );
          // Maintain order from featuredProductIds
          const orderedProducts = data.landingPage.featuredProductIds
            .map((id: string) => featured.find((p: any) => p.id === id))
            .filter(Boolean);
          setFeaturedProducts(orderedProducts);
        }
      }
    } catch (error) {
      console.error('Error fetching landing page:', error);
      router.push('/landing');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    if (!landingPage) return;

    const url = `${window.location.origin}/landing/${landingPage.slug}`;
    const title = landingPage.title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank'
        );
        break;
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`,
          '_blank'
        );
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center py-12">Loading landing page...</div>
      </div>
    );
  }

  if (!landingPage) {
    return null;
  }

  // Generate SEO metadata
  const seoData = {
    title: landingPage.metaTitle || landingPage.title,
    description: landingPage.metaDescription || landingPage.excerpt || '',
    keywords: landingPage.metaKeywords || [],
    ogImage: landingPage.featuredImage || undefined,
  };

  return (
    <div>
      <SEOHead seo={seoData} />
      <ArticleSchema
        title={landingPage.title}
        description={landingPage.excerpt}
        image={landingPage.featuredImage || undefined}
        datePublished={new Date(landingPage.createdAt).toISOString()}
        dateModified={new Date(landingPage.updatedAt).toISOString()}
        category="Landing Page"
      />
      {/* Breadcrumbs */}
      <section className="border-b bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 py-3 md:py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
            <Link href="/" className="hover:text-primary whitespace-nowrap">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <Link href="/landing" className="hover:text-primary whitespace-nowrap">
              Landing Pages
            </Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate">{landingPage.title}</span>
          </nav>
        </div>
      </section>

      {/* Landing Page Content */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 max-w-4xl">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 md:mb-8">
            {landingPage.title}
          </h1>

          {/* Featured Image */}
          <div className="relative w-full h-64 md:h-96 lg:h-[500px] mb-8 md:mb-12 rounded-lg overflow-hidden">
            <Image
              src={landingPage.featuredImage}
              alt={landingPage.featuredImageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Landing Page Content with Embeds */}
          <ArticleContent
            content={landingPage.content}
            className="mb-8 md:mb-12"
          />
        </div>
      </article>

      {/* Product Showcase */}
      {featuredProducts.length > 0 && (
        <ProductShowcase
          products={featuredProducts}
          layout={landingPage.productShowcaseLayout as 'GRID' | 'CAROUSEL' | 'FEATURED'}
          onProductClick={(productId) =>
            trackClick({
              clickType: 'PRODUCT',
              targetId: productId,
            })
          }
        />
      )}

      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 max-w-4xl">
          {/* Tags */}
          {landingPage.tags.length > 0 && (
            <div className="mb-8 md:mb-12 pb-8 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {landingPage.tags.map((tagRelation) => (
                  <Link
                    key={tagRelation.tag.id}
                    href={`/landing?tag=${tagRelation.tag.name}`}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {tagRelation.tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Social Share */}
          <div className="mb-12 md:mb-16 pb-8 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this page</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={() => handleShare('facebook')}
                className="gap-2"
              >
                <Facebook className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook</span>
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => handleShare('twitter')}
                className="gap-2"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => handleShare('whatsapp')}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => handleShare('copy')}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Related Landing Pages */}
          {relatedLandingPages.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">
                Related Pages
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedLandingPages.map((relatedPage) => (
                  <Link key={relatedPage.id} href={`/landing/${relatedPage.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer">
                      {/* Featured Image */}
                      <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                        <Image
                          src={relatedPage.featuredImage}
                          alt={relatedPage.featuredImageAlt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <CardContent className="p-4">
                        {/* Title */}
                        <h3 className="text-base md:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedPage.title}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
            Explore Our Products
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 max-w-2xl mx-auto">
            Discover our range of products and find what's perfect for you
          </p>
          <Link href="/products">
            <Button
              size="default"
              className="md:h-11 md:px-8"
              onClick={() =>
                trackClick({
                  clickType: 'CTA',
                  targetUrl: '/products',
                })
              }
            >
              Browse Products
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
