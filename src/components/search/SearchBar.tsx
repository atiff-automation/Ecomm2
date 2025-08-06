/**
 * Search Bar Component - Malaysian E-commerce Platform
 * Reusable search bar with suggestions and quick navigation
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface Suggestion {
  type: 'product' | 'category' | 'popular';
  text: string;
  url: string;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
}

export function SearchBar({
  placeholder = 'Search products, brands, categories...',
  className = '',
  autoFocus = false,
  showSuggestions = true,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{
    [key: string]: Suggestion[];
  }>({});
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Get search suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      if (
        !debouncedQuery.trim() ||
        debouncedQuery.length < 2 ||
        !showSuggestions
      ) {
        setSuggestions({});
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/search?suggestions=true&q=${encodeURIComponent(debouncedQuery)}&limit=6`
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Failed to get suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    getSuggestions();
  }, [debouncedQuery, showSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestionsList(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'product' || suggestion.type === 'popular') {
      if (suggestion.url.startsWith('/search')) {
        const url = new URL(suggestion.url, window.location.origin);
        const searchQuery = url.searchParams.get('q') || '';
        setQuery(searchQuery);
        router.push(suggestion.url);
      } else {
        router.push(suggestion.url);
      }
    } else {
      router.push(suggestion.url);
    }
    setShowSuggestionsList(false);
  };

  const handleInputFocus = () => {
    if (showSuggestions) {
      setShowSuggestionsList(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestionsList(false);
    }, 200);
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions({});
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const allSuggestions = [
    ...(suggestions.products || []),
    ...(suggestions.categories || []),
    ...(suggestions.popular || []),
  ];

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoFocus={autoFocus}
          className="pl-10 pr-20"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearQuery}
              className="w-6 h-6 p-0 hover:bg-muted-foreground/10"
            >
              <X className="w-3 h-3" />
            </Button>
          )}

          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Button type="submit" size="sm" className="h-7">
              <Search className="w-3 h-3" />
            </Button>
          )}
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && showSuggestionsList && allSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {allSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 border-b last:border-b-0"
                >
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm block truncate">
                      {suggestion.text}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {suggestion.type === 'product'
                        ? 'Product'
                        : suggestion.type === 'category'
                          ? 'Category'
                          : 'Popular search'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
