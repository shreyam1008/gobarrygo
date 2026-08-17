import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const root = new URL(import.meta.env.BASE_URL, site).toString();

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${root}sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};
