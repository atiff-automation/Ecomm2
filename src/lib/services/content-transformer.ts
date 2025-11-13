/**
 * Content Transformer Service
 * Single Source of Truth for all article content transformations
 * Handles YouTube embeds, product links, and future embed types
 */

import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';
import { ProductEmbedService } from './product-embed-service';
import type { ProductEmbedData } from '@/types/article.types';

export class ContentTransformerService {
  /**
   * Transform YouTube links to embedded video players
   * Detects both youtube.com/watch and youtu.be formats in anchor tags
   * @param html Raw HTML content from article
   * @returns HTML with YouTube embeds
   */
  static transformYouTubeLinks(html: string): string {
    let transformed = html;
    const { VIDEO_ID_LENGTH } = ARTICLE_CONSTANTS.EMBEDS.YOUTUBE;

    // Track processed video IDs to avoid duplicates
    const processedIds = new Set<string>();

    // Pattern to match <a> tags containing YouTube URLs
    // Matches: <a href="https://www.youtube.com/watch?v=VIDEO_ID" ...>...</a>
    const youtubeWatchPattern = /<a[^>]*href=["'](?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})[^"']*["'][^>]*>.*?<\/a>/gi;

    // Matches: <a href="https://youtu.be/VIDEO_ID" ...>...</a>
    const youtubeShortPattern = /<a[^>]*href=["'](?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})[^"']*["'][^>]*>.*?<\/a>/gi;

    // Transform youtube.com/watch?v= format
    transformed = transformed.replace(youtubeWatchPattern, (match, videoId) => {
      // Validate video ID
      if (!videoId || videoId.length !== VIDEO_ID_LENGTH) {
        return match; // Keep original if invalid
      }

      // Skip if already processed
      if (processedIds.has(videoId)) {
        return match;
      }
      processedIds.add(videoId);

      // Generate embed markup
      const originalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      return this.generateYouTubeEmbedMarkup(videoId, originalUrl);
    });

    // Transform youtu.be/ format
    transformed = transformed.replace(youtubeShortPattern, (match, videoId) => {
      // Validate video ID
      if (!videoId || videoId.length !== VIDEO_ID_LENGTH) {
        return match; // Keep original if invalid
      }

      // Skip if already processed
      if (processedIds.has(videoId)) {
        return match;
      }
      processedIds.add(videoId);

      // Generate embed markup
      const originalUrl = `https://youtu.be/${videoId}`;
      return this.generateYouTubeEmbedMarkup(videoId, originalUrl);
    });

    return transformed;
  }

  /**
   * Generate YouTube embed HTML markup
   * @param videoId YouTube video ID
   * @param originalUrl Original YouTube URL for fallback link
   * @returns HTML string with embed and fallback link
   */
  private static generateYouTubeEmbedMarkup(
    videoId: string,
    originalUrl: string
  ): string {
    const { EMBED_BASE_URL, IFRAME_ATTRIBUTES } = ARTICLE_CONSTANTS.EMBEDS.YOUTUBE;
    const embedUrl = `${EMBED_BASE_URL}${videoId}`;

    // Return responsive embed container with iframe
    return `<div class="youtube-embed-wrapper my-6" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 8px;">
  <iframe
    src="${embedUrl}"
    title="YouTube video player"
    allow="${IFRAME_ATTRIBUTES.allow}"
    allowfullscreen
    loading="${IFRAME_ATTRIBUTES.loading}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    aria-label="YouTube video player"
  ></iframe>
</div>
<p class="text-sm text-gray-500 text-center -mt-4 mb-6">
  <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Watch on YouTube</a>
</p>`;
  }

  /**
   * Transform product links to embedded product cards
   * Detects /product/[slug] and /products/[slug] patterns in anchor tags
   * Handles both relative (/products/slug) and absolute (https://domain.com/products/slug) URLs
   * @param html Raw HTML content from article
   * @param productsData Pre-fetched product data (for server-side rendering)
   * @returns HTML with product embeds
   */
  static transformProductLinks(
    html: string,
    productsData: Map<string, ProductEmbedData>
  ): string {
    let transformed = html;

    // Track processed product slugs to avoid duplicates
    const processedSlugs = new Set<string>();

    // Pattern to match <a> tags containing product URLs (both absolute and relative)
    // Matches: <a href="/products/slug" ...>...</a>
    // Matches: <a href="https://domain.com/products/slug" ...>...</a>
    const productLinkPattern = /<a[^>]*href=["'](?:https?:\/\/[^\/]+)?\/products?\/([a-z0-9-]+)["'][^>]*>.*?<\/a>/gi;

    console.log('🔍 [Product Transform] Starting transformation...');
    console.log('📊 [Product Transform] Products data size:', productsData.size);
    console.log('📊 [Product Transform] Available product slugs:', Array.from(productsData.keys()));
    console.log('📊 [Product Transform] HTML length:', html.length);

    // Transform product links to embeds
    let matchCount = 0;
    transformed = transformed.replace(productLinkPattern, (match, slug) => {
      matchCount++;
      console.log(`🎯 [Product Transform] Match #${matchCount}:`, { slug, matchPreview: match.substring(0, 100) + '...' });

      // Skip if already processed
      if (processedSlugs.has(slug)) {
        console.log(`⏭️ [Product Transform] Skipping duplicate slug: ${slug}`);
        return match;
      }
      processedSlugs.add(slug);

      // Get product data
      const product = productsData.get(slug);
      if (!product) {
        console.log(`❌ [Product Transform] Product not found for slug: ${slug}`);
        // Product not found or deleted - keep original link
        return match;
      }

      console.log(`✅ [Product Transform] Generating embed for:`, product.name);
      // Generate embed markup
      return this.generateProductEmbedMarkup(product);
    });

    console.log(`📝 [Product Transform] Total matches found: ${matchCount}`);
    console.log(`📝 [Product Transform] Unique slugs processed: ${processedSlugs.size}`);

    return transformed;
  }

  /**
   * Generate product embed HTML markup
   * @param product Product data
   * @returns HTML string with product embed card
   */
  private static generateProductEmbedMarkup(product: ProductEmbedData): string {
    // Determine which price to display
    const displayPrice = product.memberPrice || product.regularPrice;
    const showSavings = product.memberPrice && product.memberPrice < product.regularPrice;
    const savings = showSavings ? product.regularPrice - product.memberPrice : 0;

    // Stock status
    const isInStock = product.status === 'ACTIVE' && product.stockQuantity > 0;
    const stockText = isInStock ? 'In Stock' : 'Out of Stock';
    const stockColorClass = isInStock ? 'text-green-600' : 'text-red-600';

    // Generate compact product card
    return `<div class="product-embed-wrapper my-6 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white" data-product-slug="${product.slug}">
  <div class="flex gap-4">
    <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
      <img
        src="${product.featuredImage}"
        alt="${product.name}"
        class="w-full h-full object-cover rounded-md"
        loading="lazy"
      />
    </div>
    <div class="flex-1 min-w-0">
      <h4 class="font-semibold text-gray-900 text-base sm:text-lg mb-2 line-clamp-2">
        ${product.name}
      </h4>
      <div class="mb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-red-600 font-bold text-lg sm:text-xl">
            RM ${displayPrice.toFixed(2)}
          </span>
          ${showSavings ? `<span class="text-sm text-gray-500 line-through">
            RM ${product.regularPrice.toFixed(2)}
          </span>
          <span class="text-sm font-medium text-red-600">
            Save RM ${savings.toFixed(2)}
          </span>` : ''}
        </div>
        ${product.memberPrice ? `<div class="flex items-center gap-1 mt-1">
          <span class="inline-flex items-center px-2 py-0.5 text-xs border border-black text-black rounded">
            Member Price
          </span>
        </div>` : ''}
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm font-medium ${stockColorClass}">
          ${stockText}
        </span>
        <a
          href="/products/${product.slug}"
          class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
        >
          View Product
        </a>
      </div>
    </div>
  </div>
</div>`;
  }

  /**
   * Extract product slugs from HTML content
   * Handles both relative and absolute URLs
   * @param html Raw HTML content
   * @returns Array of unique product slugs
   */
  static extractProductSlugs(html: string): string[] {
    const slugs = new Set<string>();

    // Pattern to match product URLs in href attributes (both absolute and relative)
    const productLinkPattern = /href=["'](?:https?:\/\/[^\/]+)?\/products?\/([a-z0-9-]+)["']/gi;

    // Match all product links
    let match;
    while ((match = productLinkPattern.exec(html)) !== null) {
      if (match[1]) {
        slugs.add(match[1]);
      }
    }

    return Array.from(slugs);
  }

  /**
   * Transform all content (orchestrator method)
   * Applies all transformations in sequence
   * @param html Raw HTML content from article
   * @param productsData Pre-fetched product data (optional, for product embeds)
   * @returns Fully transformed HTML
   */
  static async transformContent(
    html: string,
    productsData?: Map<string, ProductEmbedData>
  ): Promise<string> {
    try {
      let transformed = html;

      // Phase 1: Transform YouTube links (synchronous)
      transformed = this.transformYouTubeLinks(transformed);

      // Phase 2: Transform product links (if product data provided)
      if (productsData && productsData.size > 0) {
        transformed = this.transformProductLinks(transformed, productsData);
      }

      return transformed;
    } catch (error) {
      console.error('Content transformation error:', error);
      // Return original content on error (graceful degradation)
      return html;
    }
  }
}
