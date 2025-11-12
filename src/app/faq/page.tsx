/**
 * Public FAQ Page
 * /faq
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { FAQPublic } from '@/types/faq.types';
import type { FAQCategoryPublic } from '@/types/faq-category.types';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQPublic[]>([]);
  const [categories, setCategories] = useState<FAQCategoryPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/public/faq-categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch FAQs
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/public/faqs');
      if (!response.ok) throw new Error('Failed to fetch FAQs');

      const data = await response.json();
      setFaqs(data.faqs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter FAQs
  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'ALL' || faq.categoryId === selectedCategory;
    const matchesSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Group by category
  const faqsByCategory = filteredFAQs.reduce((acc, faq) => {
    const categoryId = faq.categoryId;
    if (!acc[categoryId]) acc[categoryId] = [];
    acc[categoryId].push(faq);
    return acc;
  }, {} as Record<string, FAQPublic[]>);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
              Soalan Lazim (FAQ)
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 px-2">
              Jawapan kepada soalan yang sering ditanya tentang JRM HOLISTIK dan
              produk jamu kami
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari soalan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              onClick={() => setSelectedCategory('ALL')}
              size="sm"
              className="md:h-10 md:px-4"
            >
              Semua
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
                className="md:h-10 md:px-4"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 max-w-4xl">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredFAQs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Tiada soalan dijumpai. Cuba cari dengan kata kunci lain.
            </div>
          ) : (
            Object.entries(faqsByCategory).map(([categoryId, categoryFAQs]) => {
              const category = categories.find((c) => c.id === categoryId);
              return (
                <div key={categoryId} className="mb-8 md:mb-12">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
                    {category?.name || 'Unknown Category'}
                  </h2>

                <div className="space-y-3 md:space-y-4">
                  {categoryFAQs.map((faq) => {
                    const isExpanded = expandedId === faq.id;

                    return (
                      <Card
                        key={faq.id}
                        className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExpand(faq.id)}
                          className="w-full text-left px-4 py-3 md:px-6 md:py-4 flex items-start justify-between gap-3 md:gap-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          <span className="font-semibold text-gray-900 flex-1 text-sm md:text-base">
                            {faq.question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2 border-t border-gray-100">
                            <div className="text-sm md:text-base text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                              {faq.answer}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
              );
            })
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
            Tidak jumpa jawapan?
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            Hubungi kami untuk bantuan lanjut
          </p>
          <Button size="default" className="md:h-11 md:px-8">
            Hubungi Support
          </Button>
        </div>
      </section>
    </div>
  );
}
