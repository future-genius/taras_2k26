/**
 * TARAS 2K26 — Google Drive URL Transformation Helper
 *
 * Converts document viewer URLs (.../file/d/[ID]/view) into:
 * 1. Direct stream URLs (https://drive.google.com/uc?export=view&id=[ID])
 * 2. High-speed CDN thumbnail URLs (https://lh3.googleusercontent.com/d/[ID])
 *
 * Bypasses X-Frame-Options, CORS, and document viewer restrictions when
 * rendering payment proof screenshots in <img> tags in dashboards.
 */

export function getDriveFileId(url: string | undefined | null): string | null {
  if (!url) return null;
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function getDriveDirectStreamUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const fileId = getDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export function getDriveThumbnailUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const fileId = getDriveFileId(url);
  if (!fileId) return url;
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}
