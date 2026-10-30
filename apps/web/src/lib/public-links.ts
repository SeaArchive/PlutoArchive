export const liveOrigin = "https://pluto-archive.onrender.com";

export function artworkHref(slug: string) {
  return process.env.NEXT_PUBLIC_STATIC_PUBLIC === "true"
    ? `/works/view/?id=${encodeURIComponent(slug)}`
    : `/works/${encodeURIComponent(slug)}`;
}

export function privateHref(route: string) {
  return process.env.NEXT_PUBLIC_STATIC_PUBLIC === "true"
    ? liveOrigin + route
    : route;
}
