import type { SitePage, SiteSection, SiteSpecification } from "@where-they-are/contracts";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderSection = (section: SiteSection, specification: SiteSpecification): string => {
  const items = section.items.length
    ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

  const contact = section.type === "contact"
    ? `<a class="button" href="https://wa.me/${encodeURIComponent(specification.whatsapp ?? specification.phone ?? "")}">Chat on WhatsApp</a>`
    : "";

  return `<section class="section section-${section.type}">
    <div class="container">
      <h2>${escapeHtml(section.heading)}</h2>
      <p>${escapeHtml(section.body)}</p>
      ${items}
      ${contact}
    </div>
  </section>`;
};

const renderPage = (page: SitePage, specification: SiteSpecification): string =>
  page.sections.map((section) => renderSection(section, specification)).join("\n");

export const renderSiteHtml = (specification: SiteSpecification): string => {
  const home = specification.pages[0];
  const pageTitle = escapeHtml(home?.title ?? specification.businessName);
  const description = escapeHtml(home?.description ?? `Learn more about ${specification.businessName}.`);
  const body = specification.pages.map((page) => renderPage(page, specification)).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${description}" />
  <title>${pageTitle}</title>
  <style>
    :root { --primary: ${specification.primaryColor}; --accent: ${specification.accentColor}; --ink: #17202a; --paper: #f8fafc; }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--ink); background: var(--paper); font-family: Inter, ui-sans-serif, system-ui, sans-serif; line-height: 1.6; }
    .hero { color: white; background: linear-gradient(135deg, var(--primary), var(--accent)); padding: 7rem 1.5rem; }
    .container { width: min(1080px, calc(100% - 3rem)); margin: 0 auto; }
    .section { padding: 4rem 1.5rem; }
    .section:nth-child(even) { background: white; }
    h1 { max-width: 800px; font-size: clamp(2.6rem, 8vw, 5.4rem); line-height: 1.05; margin: 0; }
    h2 { font-size: clamp(1.8rem, 4vw, 3rem); line-height: 1.1; }
    p { max-width: 720px; }
    ul { display: grid; gap: .75rem; padding-left: 1.25rem; }
    .button { display: inline-block; margin-top: 1rem; color: white; background: var(--primary); padding: .8rem 1.15rem; border-radius: 999px; text-decoration: none; font-weight: 700; }
    footer { padding: 2rem 1.5rem; color: white; background: var(--ink); }
  </style>
</head>
<body>
  <header class="hero"><div class="container"><p>${escapeHtml(specification.template)}</p><h1>${escapeHtml(specification.businessName)}</h1></div></header>
  <main>${body}</main>
  <footer><div class="container"><p>${escapeHtml(specification.businessName)}${specification.location ? ` · ${escapeHtml(specification.location)}` : ""}</p></div></footer>
</body>
</html>`;
};
