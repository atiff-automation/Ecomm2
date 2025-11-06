# About Us Page Images

This directory contains images for the About Us page (`/about-us`).

## How to Upload Images

### Method 1: Direct File Upload (Easiest)

1. **Prepare your image**:
   - Recommended size: 1200x900 pixels (4:3 ratio)
   - Format: JPG, PNG, or WebP
   - File size: Keep under 500KB for fast loading
   - Optimize your image using tools like TinyPNG or ImageOptim

2. **Upload the file**:
   ```bash
   # Copy your image to this directory and name it:
   brand-story.jpg
   ```

3. **Update the About Us page**:
   - Open: `src/app/about-us/page.tsx`
   - Find the commented Image component (around line 144-151)
   - Uncomment the `<Image>` component
   - Comment out or remove the placeholder div (lines 154-165)

4. **Refresh your browser** - the image will appear!

### Method 2: Using Different Images

You can add multiple images for different sections:

```
public/uploads/about/
├── brand-story.jpg       (Main brand story image)
├── founder.jpg           (Bonda Rozita Ibrahim)
├── products-showcase.jpg (Product display)
└── heritage.jpg          (Heritage/history)
```

Then update the `src` prop in the Image component:
```tsx
<Image
  src="/uploads/about/founder.jpg"
  alt="Bonda Rozita Ibrahim"
  fill
  className="object-cover"
/>
```

## Image Guidelines

**Best Practices**:
- Use high-quality images that showcase your products
- Ensure images are properly lit and in focus
- Use consistent style across all images
- Include people using products (builds trust)
- Show certifications (KKM, Halal badges)

**SEO Tips**:
- Use descriptive filenames: `jrm-holistik-products.jpg` instead of `IMG_1234.jpg`
- Alt text is already optimized in the code
- Keep file sizes small for faster loading

## Need Help?

If you need to resize or optimize images:
- **Online**: TinyPNG.com, Squoosh.app
- **Mac**: Preview (Tools → Adjust Size)
- **Windows**: Paint, Photos app

For any issues, check the Next.js Image documentation:
https://nextjs.org/docs/app/api-reference/components/image
