import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import type { LoaderFunction } from 'react-router';

const MAX_SIZE = 2500;
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

sharp.cache({
  memory: 100,
  files: 200,
  items: 500,
});

sharp.simd(true);
sharp.concurrency(0);

function getContentType(format: string) {
  switch (format) {
    case 'avif':
      return 'image/avif';

    case 'webp':
      return 'image/webp';

    case 'png':
      return 'image/png';

    default:
      return 'image/jpeg';
  }
}

function detectFormat(request: Request, forced?: string | null): string {
  if (forced) {
    return forced.toLowerCase();
  }

  const accept = request.headers.get('accept') || '';

  if (accept.includes('image/avif')) {
    return 'avif';
  }

  if (accept.includes('image/webp')) {
    return 'webp';
  }

  return 'jpeg';
}

async function loadImage(src: string) {
  if (/^https?:\/\//i.test(src)) {
    const response = await fetch(src, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Image fetch failed: ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  const resolvedPath = path.resolve(PUBLIC_DIR, src.replace(/^\/+/, ''));

  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    throw new Error('Invalid path');
  }

  return fs.readFile(resolvedPath);
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);

    const src = url.searchParams.get('src');

    if (!src) {
      return new Response('Missing src', {
        status: 400,
      });
    }

    const width = Math.min(Math.max(Number(url.searchParams.get('w')) || 0, 0), MAX_SIZE);

    const height = Math.min(Math.max(Number(url.searchParams.get('h')) || 0, 0), MAX_SIZE);

    const quality = Math.min(Math.max(Number(url.searchParams.get('q')) || 80, 1), 100);

    const format = detectFormat(request, url.searchParams.get('format'));

    const etag = crypto.createHash('md5').update([src, width, height, quality, format].join('-')).digest('hex');

    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, {
        status: 304,
      });
    }

    const input = await loadImage(src);

    let image = sharp(input, {
      limitInputPixels: 16777216,
      sequentialRead: true,
    });

    if (width || height) {
      image = image.resize(width || undefined, height || undefined, {
        fit: 'cover',
        withoutEnlargement: true,
        fastShrinkOnLoad: true,
      });
    }

    switch (format) {
      case 'avif':
        image = image.avif({
          quality,
          effort: 4,
        });
        break;

      case 'webp':
        image = image.webp({
          quality,
        });
        break;

      case 'png':
        image = image.png({
          compressionLevel: 9,
          palette: true,
        });
        break;

      default:
        image = image.jpeg({
          quality,
          mozjpeg: true,
          progressive: true,
        });
    }

    const output = await image.toBuffer();

    return new Response(new Uint8Array(output), {
      headers: {
        'Content-Type': getContentType(format),

        ETag: etag,

        Vary: 'Accept',

        'Cache-Control': 'public, max-age=31536000, immutable',

        'CDN-Cache-Control': 'public, max-age=31536000',

        'X-Image-Format': format,
      },
    });
  } catch (error) {
    console.error(error);

    return new Response('Image processing failed', {
      status: 500,
    });
  }
};
