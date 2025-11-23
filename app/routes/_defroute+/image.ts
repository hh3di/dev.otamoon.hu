import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import axios from 'axios';
import type { LoaderFunction } from 'react-router';

// Az összes támogatott formátum (Sharp által támogatott)
const allowedFormats = ['gif', 'png', 'jpeg', 'jpg', 'webp', 'avif', 'heif', 'tiff', 'svg'];
const outputFormats = ['gif', 'png', 'jpeg', 'jpg', 'webp', 'avif', 'tiff'];

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const src = url.searchParams.get('src');
  const width = Math.min(parseInt(url.searchParams.get('w') || '0', 10), 4000);
  const height = Math.min(parseInt(url.searchParams.get('h') || '0', 10), 4000);
  const quality = Math.max(1, Math.min(parseInt(url.searchParams.get('q') || '80', 10), 100));
  const format: string = url.searchParams.get('format') || 'webp';
  const fit = url.searchParams.get('fit') || 'cover'; // cover, contain, fill, inside, outside

  if (!src) return new Response(null, { status: 400 });
  const srcExt = path.extname(src || '').toLowerCase();
  try {
    let imageBuffer: Buffer;
    if (src.startsWith('https://') || src.startsWith('http://')) {
      const { data: res } = await axios(src, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxContentLength: 50 * 1024 * 1024, // 50MB limit
        headers: {
          Accept: 'image/*',
          'User-Agent': 'Mozilla/5.0 (compatible; ImageProcessor/1.0)',
        },
      });
      imageBuffer = res;
    } else {
      const publicDir = path.join(process.cwd(), 'public');
      const imagePath = path.join(publicDir, src);
      if (!imagePath.startsWith(publicDir)) {
        return new Response(null, { status: 403 });
      }
      const stats = await fs.stat(imagePath);
      if (!stats.isFile()) return new Response(null);
      imageBuffer = await fs.readFile(imagePath);
    }

    const sharpInstance = sharp(imageBuffer);
    const metadata = await sharpInstance.metadata();
    let ext = metadata.format;

    if (!ext) {
      return new Response(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': `image/${srcExt.slice(1)}`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Normalizáljuk a formátumokat
    if (ext === 'jpg') ext = 'jpeg';
    let requestedFormat = format.toLowerCase();
    if (requestedFormat === 'jpg') requestedFormat = 'jpeg';

    if (!allowedFormats.includes(ext) || !outputFormats.includes(requestedFormat)) {
      return new Response(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': `image/${ext}`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Animált képek detektálása (GIF és WebP esetén)
    const isInputAnimated = (ext === 'gif' && metadata.pages && metadata.pages > 1) || (ext === 'webp' && metadata.pages && metadata.pages > 1);
    const canOutputAnimation = ['gif', 'webp'].includes(requestedFormat);
    const isAnimated = isInputAnimated && canOutputAnimation;

    let image = sharp(imageBuffer, {
      animated: Boolean(isAnimated),
      limitInputPixels: 268402689, // ~16384x16384 max
      sequentialRead: true, // Optimalizáció nagy képekhez
    });

    if (width > 4000 || height > 4000) {
      return new Response(null, { status: 400, statusText: 'Image dimensions too large' });
    }

    // Resize csak ha szükséges
    if (width > 0 || height > 0) {
      const resizeOptions: any = {
        fit: fit as any,
        withoutEnlargement: true, // Ne nagyítsuk a képet az eredeti mérettől
      };

      if (width > 0) resizeOptions.width = width;
      if (height > 0) resizeOptions.height = height;

      image = image.resize(resizeOptions);
    }

    // Formátum konverzió optimalizált beállításokkal
    if (requestedFormat && sharp.format[requestedFormat as keyof sharp.FormatEnum]) {
      const formatOptions: any = { quality };

      switch (requestedFormat) {
        case 'webp':
          formatOptions.effort = 4; // Jó kompromisszum sebesség/minőség között
          if (isAnimated) formatOptions.loop = 0;
          break;
        case 'avif':
          formatOptions.effort = 4;
          formatOptions.chromaSubsampling = '4:2:0';
          break;
        case 'jpeg':
          formatOptions.progressive = true;
          formatOptions.mozjpeg = true;
          break;
        case 'png':
          formatOptions.compressionLevel = 6;
          formatOptions.progressive = true;
          break;
        case 'gif':
          if (isAnimated) {
            formatOptions.loop = 0;
            formatOptions.delay = metadata.delay || [100]; // Default 100ms frame delay
          }
          break;
      }

      image = image.toFormat(requestedFormat as keyof sharp.FormatEnum, formatOptions);
    }

    const processedBuffer = await image.toBuffer();
    return new Response(new Uint8Array(processedBuffer), {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new Response(null, { status: 400 });
  }
};
