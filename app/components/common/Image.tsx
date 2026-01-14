import { useRef, useEffect, useState } from 'react';

export default function Image({
  src,
  alt,
  width,
  height,
  quality = 75,
  objectFit = 'contain',
  objectPosition = 'center',
  format = 'webp',
  className = '',
  noloading,
}: {
  src: string;
  alt: string;
  width: number | undefined;
  height: number | undefined;
  quality?: number;
  objectFit?: 'cover' | 'contain';
  objectPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  format?: string;
  className?: string;
  noloading?: boolean;
}) {
  const fullSizeSrc = `/image?src=${encodeURIComponent(src)}&w=${width}&h=${height}&q=${quality}&format=${format}&fit=${objectFit}&position=${objectPosition}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setIsInView(false);
  }, [src]);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (!wrapperRef.current) return;
    let observer: IntersectionObserver | null = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer?.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '200px' },
    );
    observer.observe(wrapperRef.current);
    return () => observer && observer.disconnect();
  }, [src]);

  return (
    <div ref={wrapperRef} className={`${className.includes('absolute') ? '' : 'relative'} overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && !noloading && <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent z-10" />}
      <img
        ref={imgRef}
        src={isInView ? fullSizeSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        loading="eager"
        style={{
          objectPosition: objectPosition || 'center',
          objectFit: objectFit || 'contain',
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoaded ? 1 : 0,
          width: '100%',
          height: '100%',
        }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        decoding="async"
        fetchPriority="high"
      />

      {/* <noscript> fallback for SEO/SSR/JS-less */}
      <noscript>
        <img
          src={fullSizeSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: objectFit || 'contain', objectPosition: objectPosition || 'center' }}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </noscript>
    </div>
  );
}
