/**
 * Single Article Page
 * /article/[slug]
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Eye,
  User,
  Calendar,
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
import { format } from 'date-fns';
import type { ArticleWithRelations } from '@/types/article.types';
import SEOHead from '@/components/seo/SEOHead';
import { SEOService } from '@/lib/seo/seo-service';
import { ArticleContent } from '@/components/article/embeds/ArticleContent';
import { ArticleSchema } from '@/components/seo/ArticleSchema';

interface SingleArticlePageProps {
  params: { slug: string };
}

export default function SingleArticlePage({ params }: SingleArticlePageProps) {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleWithRelations | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<ArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [params.slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);

      // Fetch article
      const response = await fetch(`/api/public/articles/${params.slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/article');
          return;
        }
        throw new Error('Failed to fetch article');
      }

      const data = await response.json();
      setArticle(data.article);

      // Fetch related articles (same category)
      if (data.article.category.slug) {
        const relatedResponse = await fetch(
          `/api/public/articles?category=${data.article.category.slug}&status=PUBLISHED&pageSize=3&exclude=${data.article.id}`
        );
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          setRelatedArticles(relatedData.articles.slice(0, 3));
        }
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      router.push('/article');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    if (!article) return;

    const url = `${window.location.origin}/article/${article.slug}`;
    const title = article.title;

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
        <div className="text-center py-12">Loading article...</div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  // Generate SEO metadata
  const seoData = SEOService.getArticleSEO(article);

  return (
    <div>
      <SEOHead seo={seoData} />
      <ArticleSchema
        title={article.title}
        description={article.excerpt}
        image={article.featuredImage || undefined}
        datePublished={new Date(article.createdAt).toISOString()}
        dateModified={new Date(article.updatedAt).toISOString()}
        category={article.category.name}
      />
      {/* Breadcrumbs */}
      <section className="border-b bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 py-3 md:py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
            <Link href="/" className="hover:text-primary whitespace-nowrap">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <Link href="/article" className="hover:text-primary whitespace-nowrap">
              Articles
            </Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <Link
              href={`/article?category=${article.category.slug}`}
              className="hover:text-primary whitespace-nowrap"
            >
              {article.category.name}
            </Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate">{article.title}</span>
          </nav>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 max-w-4xl">
          {/* Category Badge */}
          <div className="mb-4">
            <Badge
              variant="outline"
              style={{
                borderColor: article.category.color || '#3B82F6',
                color: article.category.color || '#3B82F6',
              }}
            >
              {article.category.name}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-gray-600 mb-6 md:mb-8 pb-6 border-b">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 md:w-5 md:h-5" />
              <span>
                {article.author.firstName} {article.author.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              <span>
                {article.publishedAt
                  ? format(new Date(article.publishedAt), 'MMMM d, yyyy')
                  : 'Draft'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              <span>{article.readingTimeMin} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 md:w-5 md:h-5" />
              <span>{article.viewCount} views</span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative w-full h-64 md:h-96 lg:h-[500px] mb-8 md:mb-12 rounded-lg overflow-hidden">
            <Image
              src={article.featuredImage}
              alt={article.featuredImageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Article Content with Embeds */}
          <ArticleContent
            content={article.content}
            className="mb-8 md:mb-12"
          />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mb-8 md:mb-12 pb-8 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tagRelation) => (
                  <Link
                    key={tagRelation.tag.id}
                    href={`/article?tag=${tagRelation.tag.name}`}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
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

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Link key={relatedArticle.id} href={`/article/${relatedArticle.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer">
                      {/* Featured Image */}
                      <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                        <Image
                          src={relatedArticle.featuredImage}
                          alt={relatedArticle.featuredImageAlt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <CardContent className="p-4">
                        {/* Category Badge */}
                        <Badge
                          variant="outline"
                          className="mb-2"
                          style={{
                            borderColor: relatedArticle.category.color || '#3B82F6',
                            color: relatedArticle.category.color || '#3B82F6',
                          }}
                        >
                          {relatedArticle.category.name}
                        </Badge>

                        {/* Title */}
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedArticle.title}
                        </h3>

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{relatedArticle.readingTimeMin} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{relatedArticle.viewCount}</span>
                          </div>
                        </div>
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
      <section className="py-12 md:py-16 bg-gradient-to-br from-green-50 to-emerald-50 border-t">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
            Explore More Articles
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 max-w-2xl mx-auto">
            Discover more health tips, wellness guides, and expert insights
          </p>
          <Link href="/article">
            <Button size="default" className="md:h-11 md:px-8">
              View All Articles
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
