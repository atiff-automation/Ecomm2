/**
 * Public Article Listing Page
 * /article
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, Eye, User, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import type { ArticleWithRelations, ArticleCategory } from '@/types/article.types';
import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';
import SEOHead from '@/components/seo/SEOHead';
import { SEOService } from '@/lib/seo/seo-service';

interface TopTag {
  name: string;
  count: number;
}

export default function ArticlePage() {
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [topTags, setTopTags] = useState<TopTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/article-categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories.filter((c: ArticleCategory) => c.isActive));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedTag, page, search]);

  const fetchArticles = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('status', 'PUBLISHED');
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedTag) params.append('tag', selectedTag);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('pageSize', ARTICLE_CONSTANTS.UI.ARTICLES_PER_PAGE.toString());

      const response = await fetch(`/api/public/articles?${params}`);

      if (!response.ok) throw new Error('Failed to fetch articles');

      const data = await response.json();
      setArticles(data.articles);
      setTotalPages(data.totalPages);
      setTopTags(data.topTags || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchArticles();
  };

  const handleCategoryFilter = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setSelectedTag('');
    setPage(1);
  };

  const handleTagFilter = (tagName: string) => {
    setSelectedTag(tagName === selectedTag ? '' : tagName);
    setSelectedCategory('ALL');
    setPage(1);
  };

  // Generate SEO metadata
  const seoData = SEOService.getArticleListingSEO(page);

  return (
    <div>
      <SEOHead seo={seoData} />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
              Articles & Health Tips
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 px-2">
              Discover expert insights about traditional jamu, wellness, and women's health
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-6 md:py-8 border-b">
        <div className="container mx-auto px-4 md:px-6 lg:px-16">
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
            <Button
              variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
              onClick={() => handleCategoryFilter('ALL')}
              size="sm"
              className="md:h-10 md:px-4"
            >
              All Categories
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                onClick={() => handleCategoryFilter(cat.slug)}
                size="sm"
                className="md:h-10 md:px-4"
                style={
                  selectedCategory === cat.slug
                    ? { backgroundColor: cat.color || '#3B82F6', borderColor: cat.color || '#3B82F6' }
                    : {}
                }
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Tag Cloud */}
      {topTags.length > 0 && (
        <section className="py-6 md:py-8 border-b bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 lg:px-16">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 text-center">
              Popular Topics
            </h2>
            <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
              {topTags.map((tag) => (
                <Badge
                  key={tag.name}
                  variant={selectedTag === tag.name ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1 text-sm"
                  onClick={() => handleTagFilter(tag.name)}
                >
                  {tag.name} ({tag.count})
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Article Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-16">
          {loading ? (
            <div className="text-center py-12">Loading articles...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No articles found.</p>
              <p className="text-sm mt-2">Try searching with different keywords or categories.</p>
            </div>
          ) : (
            <>
              {/* Article Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                {articles.map((article) => (
                  <Link key={article.id} href={`/article/${article.slug}`}>
                    <Card className="h-full hover:shadow-xl transition-shadow duration-300 overflow-hidden group cursor-pointer">
                      {/* Featured Image */}
                      <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gray-200">
                        <Image
                          src={article.featuredImage}
                          alt={article.featuredImageAlt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <CardContent className="p-4 md:p-6">
                        {/* Category Badge */}
                        <Badge
                          variant="outline"
                          className="mb-3"
                          style={{
                            borderColor: article.category.color || '#3B82F6',
                            color: article.category.color || '#3B82F6',
                          }}
                        >
                          {article.category.name}
                        </Badge>

                        {/* Title */}
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>

                        {/* Excerpt */}
                        {article.excerpt && (
                          <p className="text-sm md:text-base text-gray-600 mb-4 line-clamp-3">
                            {article.excerpt}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500 pt-4 border-t">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 md:w-4 md:h-4" />
                            <span>
                              {article.author.firstName} {article.author.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                            <span>
                              {article.publishedAt
                                ? format(new Date(article.publishedAt), 'MMM d, yyyy')
                                : 'Draft'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{article.readingTimeMin} min read</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{article.viewCount} views</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 md:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="md:h-10 md:px-6"
                  >
                    Previous
                  </Button>
                  <span className="text-sm md:text-base text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="md:h-10 md:px-6"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
            Want to Learn More?
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest articles, health tips, and exclusive offers
          </p>
          <Button size="default" className="md:h-11 md:px-8">
            Subscribe Now
          </Button>
        </div>
      </section>
    </div>
  );
}
