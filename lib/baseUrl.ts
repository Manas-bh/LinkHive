const DEFAULT_BASE_URL = "http://localhost:3000";

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return sanitize(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (process.env.VERCEL_URL) {
    return `https://${sanitize(process.env.VERCEL_URL)}`;
  }

  return DEFAULT_BASE_URL;
}

function sanitize(url: string) {
  return url.replace(/\/$/, "");
}
