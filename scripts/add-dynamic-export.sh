#!/bin/bash

# Add 'export const dynamic = 'force-dynamic'' to all API route files
# This prevents Next.js from attempting static generation during build

echo "🔧 Adding dynamic export to all API routes..."

# Find all route.ts files in src/app/api
find src/app/api -type f -name "route.ts" | while read -r file; do
  # Check if the file already has the export
  if grep -q "export const dynamic" "$file"; then
    echo "⏭️  Skipping $file (already has dynamic export)"
  else
    # Add the export at the top of the file after imports
    # Create temporary file with the export
    {
      # Print first line (usually import or comment)
      head -n 1 "$file"

      # Add the dynamic export
      echo ""
      echo "export const dynamic = 'force-dynamic';"
      echo ""

      # Print rest of the file starting from line 2
      tail -n +2 "$file"
    } > "$file.tmp"

    # Replace original file
    mv "$file.tmp" "$file"

    echo "✅ Added to $file"
  fi
done

echo ""
echo "✅ Dynamic export added to all API routes"
echo "📊 Total files processed: $(find src/app/api -type f -name 'route.ts' | wc -l)"
