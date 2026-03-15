import { forwardRef, type ImgHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';
import './image.css';

const FALLBACK_IMAGE_URL = "https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png";

type ImageFittingType = 'fill' | 'fit';

type WixImageDataProps = {
  fittingType?: ImageFittingType;
  originWidth?: number;
  originHeight?: number;
  focalPointX?: number;
  focalPointY?: number;
};

export type ImageProps = ImgHTMLAttributes<HTMLImageElement> & WixImageDataProps;

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ className, src, alt, fittingType = 'fill', onError, ...props }, ref) => {
    const [imgSrc, setImgSrc] = useState(src);

    if (!src && !imgSrc) {
      return <div data-empty-image className={className} />;
    }

    return (
      <img
        ref={ref}
        src={imgSrc}
        alt={alt ?? ''}
        className={cn(
          fittingType === 'fit' ? 'object-contain' : 'object-cover',
          className
        )}
        onError={(e) => {
          if (imgSrc !== FALLBACK_IMAGE_URL) {
            setImgSrc(FALLBACK_IMAGE_URL);
          }
          onError?.(e);
        }}
        {...props}
      />
    );
  }
);
Image.displayName = 'Image';
