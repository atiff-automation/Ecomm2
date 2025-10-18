/**
 * Image Utility Functions
 * Provides utilities for image processing, conversion, and optimization
 */

/**
 * Convert an image URL to a base64 data URI
 * This is useful for embedding images directly in HTML/PDFs
 *
 * @param imageUrl - The URL of the image to convert
 * @returns Base64 data URI string or null if conversion fails
 */
export async function imageUrlToBase64(
  imageUrl: string
): Promise<string | null> {
  try {
    // Handle relative URLs by converting to absolute
    let absoluteUrl = imageUrl;

    // If it's a relative URL, we need the base URL from environment
    if (imageUrl.startsWith('/')) {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.VERCEL_URL ||
        'http://localhost:3000';
      absoluteUrl = `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}${imageUrl}`;
    }

    console.log('🖼️  Converting image to base64:', absoluteUrl);

    // Fetch the image
    const response = await fetch(absoluteUrl);

    if (!response.ok) {
      console.error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
      return null;
    }

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer();

    // Convert to base64
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'image/png';

    // Create data URI
    const dataUri = `data:${contentType};base64,${base64}`;

    console.log(
      `✅ Image converted to base64 (${Math.round(base64.length / 1024)}KB)`
    );

    return dataUri;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

/**
 * Get image dimensions from a URL
 *
 * @param imageUrl - The URL of the image
 * @returns Object with width and height or null if it fails
 */
export async function getImageDimensions(
  imageUrl: string
): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Simple PNG dimension detection (bytes 16-23)
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // Simple JPEG dimension detection would require more complex parsing
    // For now, return null for non-PNG images
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

/**
 * Validate if a URL is a valid image URL
 *
 * @param url - The URL to validate
 * @returns true if the URL appears to be an image
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.svg',
    '.webp',
    '.bmp',
  ];
  const lowerUrl = url.toLowerCase();

  return imageExtensions.some(ext => lowerUrl.includes(ext));
}
