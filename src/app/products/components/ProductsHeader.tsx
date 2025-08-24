/**
 * Products Header Server Component
 * Server-rendered header with SEO-optimized content
 */

interface ProductsHeaderProps {
  totalCount: number;
  searchTerm?: string;
  selectedCategory?: string;
  categoryName?: string;
}

export function ProductsHeader({
  totalCount,
  searchTerm,
  selectedCategory,
  categoryName = 'All Categories',
}: ProductsHeaderProps) {
  // Generate dynamic title and description based on search/filter state
  let title = 'Products';
  let description = '';

  if (searchTerm && selectedCategory && selectedCategory !== 'all') {
    title = `"${searchTerm}" in ${categoryName}`;
    description = `${totalCount} product${totalCount !== 1 ? 's' : ''} found`;
  } else if (searchTerm) {
    title = `Search: "${searchTerm}"`;
    description = `${totalCount} product${totalCount !== 1 ? 's' : ''} found`;
  } else if (selectedCategory && selectedCategory !== 'all') {
    title = categoryName;
    description = `${totalCount} product${totalCount !== 1 ? 's' : ''} in this category`;
  } else {
    description = totalCount > 0 
      ? `${totalCount} products available` 
      : 'No products available';
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        
        {/* Structured data for search engines */}
        {searchTerm && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SearchResultsPage',
                'mainEntity': {
                  '@type': 'ItemList',
                  'numberOfItems': totalCount,
                  'name': `Search results for "${searchTerm}"`,
                },
              }),
            }}
          />
        )}
      </div>
    </div>
  );
}