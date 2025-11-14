/**
 * Admin FAQ List Page
 * /admin/content/faqs
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FolderOpen,
} from 'lucide-react';
import { FAQ_CONSTANTS } from '@/lib/constants/faq-constants';
import type { FAQCategoryPublic } from '@/types/faq-category.types';
import { FAQWithRelations } from '@/types/faq.types';
import { toast } from 'sonner';
import { DragDropTable } from '@/components/admin/DragDropTable';
import { prepareReorderPayload } from '@/lib/utils/drag-drop-utils';
import { DRAG_DROP_CONSTANTS } from '@/lib/constants/drag-drop-constants';

export default function AdminFAQListPage() {
  const router = useRouter();

  // State
  const [faqs, setFaqs] = useState<FAQWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<FAQCategoryPublic[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/faq-categories');
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
  }, [categoryFilter, statusFilter]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await fetch(
        `${FAQ_CONSTANTS.API_ROUTES.ADMIN_BASE}?${params}`
      );

      if (!response.ok) throw new Error('Failed to fetch FAQs');

      const data = await response.json();
      setFaqs(data.faqs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetchWithCSRF(
        `${FAQ_CONSTANTS.API_ROUTES.ADMIN_BASE}/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete FAQ');

      toast.success('FAQ deleted successfully');

      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    }
  };

  // Handle reorder
  const handleReorder = async (reorderedFAQs: FAQWithRelations[]) => {
    try {
      const payload = prepareReorderPayload(reorderedFAQs);

      const response = await fetchWithCSRF(DRAG_DROP_CONSTANTS.API_ROUTES.REORDER_FAQS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder FAQs');
      }

      // Update local state with new order
      setFaqs(reorderedFAQs);
    } catch (error) {
      console.error('Error reordering FAQs:', error);
      throw error; // Re-throw for DragDropTable to handle rollback
    }
  };

  // Filter FAQs by search
  const filteredFAQs = faqs.filter(faq =>
    search
      ? faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">FAQ Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage frequently asked questions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <Link href="/admin/content/faq-categories" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <FolderOpen className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Manage Categories</span>
              <span className="md:hidden">Categories</span>
            </Button>
          </Link>
          <Link href="/admin/content/faqs/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Create New FAQ</span>
              <span className="md:hidden">Create FAQ</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 md:mb-6">
        <CardContent className="pt-4 md:pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* Search */}
            <div className="relative md:col-span-3 lg:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {Object.values(FAQ_CONSTANTS.STATUS).map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredFAQs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No FAQs found</p>
          </CardContent>
        </Card>
      ) : (
        <DragDropTable
          items={filteredFAQs}
          onReorder={handleReorder}
          className="space-y-3 md:space-y-4"
          renderItem={(faq) => (
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h3 className="text-base md:text-lg font-semibold flex-1 pr-2">
                      {faq.question}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {faq.status === 'ACTIVE' ? (
                        <span className="flex items-center text-xs md:text-sm text-green-600">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-xs md:text-sm text-gray-500">
                          <XCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2 whitespace-pre-wrap break-words">
                    {faq.answer}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                      <span className="truncate">
                        Category: {faq.category?.name || 'Unknown'}
                      </span>
                      <span className="hidden sm:inline">
                        Updated:{' '}
                        {new Date(faq.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/admin/content/faqs/${faq.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(faq.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        />
      )}
    </div>
  );
}
