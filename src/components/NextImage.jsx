"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import placeholder from "../../public/static/no-image-found.png";
import { getFamilyImageFallback } from "helper-functions/CardHelpers";

const sanitizeSrc = (raw, fallback, alt) => {
  const family = getFamilyImageFallback(alt);
  if (!raw) return family || fallback;
  if (typeof raw !== "string") return raw; // StaticImageData / import — leave as-is
  const trimmed = raw.trim();
  if (!trimmed || /blank\.jpg|def\.png/i.test(trimmed)) {
    return family || fallback;
  }
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("blob:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return fallback;
};

const NextImage = ({
  src,
  altSrc = placeholder,
  alt = "Image",
  width,
  height,
  objectFit = "cover",
  borderRadius,
  aspectRatio,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(sanitizeSrc(src, altSrc, alt));

  useEffect(() => {
    setCurrentSrc(sanitizeSrc(src, altSrc, alt));
  }, [src, altSrc, alt]);

  const handleImgError = (e) => {
    if (altSrc && currentSrc !== altSrc) {
      setCurrentSrc(altSrc);
    }
    if (props.onError) props.onError(e);
  };

  const style = {
    objectFit,
    borderRadius,
    aspectRatio,
    ...props.style,
  };

  return (
    <Image
      src={currentSrc}
      width={width}
      height={height}
      alt={alt}
      loading="eager"
      priority={true}
      decoding="async"
      {...props}
      style={style}
      onError={handleImgError}
    />
  );
};

export default NextImage;
