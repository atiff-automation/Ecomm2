/**
 * Public FAQ Page
 * /soalan-lazim
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FAQ_CONSTANTS, getFAQCategoryLabel } from '@/lib/constants/faq-constants';
import type { FAQPublic } from '@/types/faq.types';

export default function SoalanLazimPage() {
  const [faqs, setFaqs] = useState<FAQPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      selectedCategory === 'ALL' || faq.category === selectedCategory;
    const matchesSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Group by category
  const faqsByCategory = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQPublic[]>);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-16">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Soalan Lazim (FAQ)
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Jawapan kepada soalan yang sering ditanya tentang JRM HOLISTIK dan
              produk jamu kami
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari soalan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('ALL')}
            >
              Semua
            </Button>
            {Object.values(FAQ_CONSTANTS.CATEGORIES).map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-16 max-w-4xl">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredFAQs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Tiada soalan dijumpai. Cuba cari dengan kata kunci lain.
            </div>
          ) : (
            Object.entries(faqsByCategory).map(([category, categoryFAQs]) => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {getFAQCategoryLabel(category)}
                </h2>

                <div className="space-y-4">
                  {categoryFAQs.map((faq) => {
                    const isExpanded = expandedId === faq.id;

                    return (
                      <Card
                        key={faq.id}
                        className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExpand(faq.id)}
                          className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          <span className="font-semibold text-gray-900 flex-1">
                            {faq.question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-6 pb-4 text-gray-700 leading-relaxed">
                            <div
                              dangerouslySetInnerHTML={{ __html: faq.answer }}
                              className="prose prose-sm max-w-none"
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tidak jumpa jawapan?
          </h2>
          <p className="text-gray-600 mb-6">
            Hubungi kami untuk bantuan lanjut
          </p>
          <Button size="lg">Hubungi Support</Button>
        </div>
      </section>
    </div>
  );
}
