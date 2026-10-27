// Robust image resolution and fallback utility for CampusMart

export const DEFAULT_FALLBACK_IMAGE = 
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%2312160F'/%3E%3Ccircle cx='200' cy='180' r='48' fill='%23C6DE41' opacity='0.12'/%3E%3Cpath d='M180 180a20 20 0 1 0 40 0a20 20 0 1 0 -40 0 M170 210h60a8 8 0 0 1 8 8v12a8 8 0 0 1 -8 8h-60a8 8 0 0 1 -8 -8v-12a8 8 0 0 1 8 -8' stroke='%23C6DE41' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' fill='none' opacity='0.85'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='12' font-weight='700' fill='%23C6DE41' text-anchor='middle'%3ECampusMart Gear%3C/text%3E%3C/svg%3E";

export function resolveProductImageUrl(imageUrl?: string | null, images?: any): string {
  let target = imageUrl;

  if (!target && images) {
    if (Array.isArray(images) && images.length > 0) {
      target = images[0];
    } else if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          target = parsed[0];
        } else {
          target = images;
        }
      } catch {
        target = images;
      }
    }
  }

  if (!target || typeof target !== 'string' || target === 'null' || target === 'undefined' || target.trim() === '') {
    return DEFAULT_FALLBACK_IMAGE;
  }

  target = target.trim();

  // Normalize windows backslashes
  target = target.replace(/\\/g, '/');

  // Handle data URIs or full URLs
  if (target.startsWith('data:') || target.startsWith('http://') || target.startsWith('https://')) {
    return target;
  }

  // Handle relative uploads path
  if (target.startsWith('/uploads/')) {
    return target;
  }

  if (target.startsWith('uploads/')) {
    return `/${target}`;
  }

  return `/${target.replace(/^\/+/, '')}`;
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_FALLBACK_IMAGE) {
    target.src = DEFAULT_FALLBACK_IMAGE;
  }
}
