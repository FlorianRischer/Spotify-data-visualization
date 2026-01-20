#!/bin/bash
# Upload Spotify data to Cloudflare R2 bucket
#
# Prerequisites:
# 1. Install wrangler: npm install -g wrangler
# 2. Login to Cloudflare: wrangler login
# 3. Create R2 bucket in Cloudflare Dashboard named "spotify-data"
# 4. Enable public access for the bucket

BUCKET_NAME="spotify-data"

echo "🚀 Uploading Spotify data to Cloudflare R2..."

# Upload artist cache
echo "📤 Uploading artist-cache.json..."
wrangler r2 object put "$BUCKET_NAME/artist-cache.json" \
  --file=static/artist-cache-2025-12-13.json \
  --content-type="application/json"

# Upload streaming history files
echo "📤 Uploading streaming history files..."
for file in static/spotify-data/*.json; do
  filename=$(basename "$file")
  echo "  → $filename"
  wrangler r2 object put "$BUCKET_NAME/spotify-data/$filename" \
    --file="$file" \
    --content-type="application/json"
done

echo ""
echo "✅ Upload complete!"
echo ""
echo "Next steps:"
echo "1. Go to Cloudflare Dashboard → R2 → $BUCKET_NAME → Settings"
echo "2. Enable 'Public access' (r2.dev subdomain)"
echo "3. Copy the public URL and update R2_BUCKET_URL in spotifyDataService.ts"
echo ""
echo "Your public URL will look like: https://pub-xxxxx.r2.dev"
