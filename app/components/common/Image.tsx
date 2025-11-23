import { useRef, useEffect, useState } from 'react';

export default function Image({
  src,
  alt,
  width,
  height,
  quality = 75,
  format = 'webp',
  className = '',
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  quality?: number;
  format?: string;
  className?: string;
}) {
  const fullSizeSrc = `/image?src=${encodeURIComponent(src)}&w=${width}&h=${height}&q=${quality}&format=${format}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
  }, []);

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 animate-pulse bg-linear-to-br from-slate-300/60 to-slate-500/40" style={{ borderRadius: 8 }} />
      )}
      <img
        ref={imgRef}
        src={isInView ? fullSizeSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        style={{
          objectFit: 'contain',
          transition: 'opacity 0.3s',
          opacity: isLoaded ? 1 : 0,
        }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        decoding="async"
        fetchPriority="auto"
      />
      {/* <noscript> fallback for SEO/SSR/JS-less */}
      <noscript>
        <img
          src={fullSizeSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
          loading="eager"
        />
      </noscript>
    </div>
  );
}
