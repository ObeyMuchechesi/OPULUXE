import { useEffect } from "react";

// Per-page <head> management (title, description, canonical, robots) for SEO.
// OG/Twitter tags stay in index.html for crawlers; this keeps the tab
// title and description correct on every route.
export default function useSEO({ title, description, path, noindex = false }) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }

    if (path) {
      const site = "https://opuluxe-iota.vercel.app";
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", `${site}${path}`);
    }

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", noindex ? "noindex, nofollow" : "index, follow");
  }, [title, description, path, noindex]);
}
