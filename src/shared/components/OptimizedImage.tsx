import React, { useState, useCallback } from 'react';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  skeleton?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback,
  skeleton = true,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(event);
  }, [onError]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        {fallback || (
          <div className="flex flex-col items-center gap-1">
            <ImageOff className="w-6 h-6" />
            <span className="text-xs">Resim yüklenemedi</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && skeleton && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 ${className}`}
        loading="lazy"
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;