import { useEffect } from 'react';

const OG = 'https://images.fillout.com/912168/hp1wine38g/generated-images/nG3ByPmVjET73xXBYgE3Nr/img_eJtcUkeY8jx_d_yB.jpg';

type Props = { title: string; description: string; path?: string; noindex?: boolean; jsonLd?: object[] };

function meta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}
function link(rel: string, href: string, extra?: Record<string, string>) {
  const sel = `link[rel="${rel}"]${extra?.hreflang ? `[hreflang="${extra.hreflang}"]` : ''}`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) { el = document.createElement('link'); el.rel = rel; Object.entries(extra ?? {}).forEach(([k, v]) => el!.setAttribute(k, v)); document.head.appendChild(el); }
  el.href = href;
}

/** Client-side SEO: title, description, canonical, Open Graph, Twitter, robots and JSON-LD. */
export default function Seo({ title, description, path = '/', noindex, jsonLd }: Props) {
  useEffect(() => {
    const url = window.location.origin + path;
    document.title = title;
    meta('name', 'description', description);
    meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    meta('name', 'keywords', 'جواب چی بدم, جواب پیام, هوش مصنوعی فارسی, جواب حاضرجواب, مخ زدن, جواب استوری, رو دست, پیام عاشقانه, جواب بامزه');
    meta('name', 'theme-color', '#fff8f5');
    meta('name', 'application-name', 'رو دست');
    meta('name', 'apple-mobile-web-app-title', 'رو دست');
    meta('name', 'format-detection', 'telephone=no');
    meta('property', 'og:type', 'website');
    meta('property', 'og:locale', 'fa_IR');
    meta('property', 'og:site_name', 'رو دست');
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:url', url);
    meta('property', 'og:image', OG);
    meta('property', 'og:image:width', '1376');
    meta('property', 'og:image:height', '768');
    meta('property', 'og:image:alt', 'رو دست — جواب‌های حاضرجواب با هوش مصنوعی');
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', OG);
    link('canonical', url);
    link('alternate', url, { hreflang: 'fa-IR' });
    link('preconnect', 'https://images.fillout.com');

    document.head.querySelectorAll('script[data-seo]').forEach((s) => s.remove());
    (jsonLd ?? []).forEach((d) => {
      const s = document.createElement('script');
      s.type = 'application/ld+json'; s.dataset.seo = '1'; s.text = JSON.stringify(d);
      document.head.appendChild(s);
    });
  }, [title, description, path, noindex, jsonLd]);
  return null;
}
