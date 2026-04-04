// lib/builder-utils.ts

export type SectionId = 'nav' | 'hero' | 'services' | 'testimonials' | 'pricing' | 'cta' | 'contact' | 'footer'

export const SECTION_ORDER: SectionId[] = [
  'nav', 'hero', 'services', 'testimonials', 'pricing', 'cta', 'contact', 'footer'
]

export const SECTION_LABELS: Record<SectionId, string> = {
  nav: 'Navigation',
  hero: 'Hero',
  services: 'Leistungen',
  testimonials: 'Testimonials',
  pricing: 'Preise',
  cta: 'Call-to-Action',
  contact: 'Kontakt',
  footer: 'Footer',
}

export interface SectionState {
  selected: boolean
  code: string
  loading: boolean
}

export type BuilderSections = Record<SectionId, SectionState>

export function createInitialSections(selected: SectionId[] = ['nav', 'hero', 'services', 'cta', 'footer']): BuilderSections {
  return Object.fromEntries(
    SECTION_ORDER.map(id => [id, { selected: selected.includes(id), code: '', loading: false }])
  ) as BuilderSections
}

export function assembleHtml(
  sections: BuilderSections,
  businessName = 'Mein Unternehmen',
  chatbotScript?: string
): string {
  const orderedCode = SECTION_ORDER
    .filter(id => sections[id].selected && sections[id].code)
    .map(id => sections[id].code)
    .join('\n\n')

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${businessName} — Professionelle Website">
  <title>${businessName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: #fff; }
    ::selection { background: #F59E0B; color: #000; }
  </style>
</head>
<body>

\${orderedCode}

<script>
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('[data-gsap]').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power2.out'
    });
  });
</script>

\${chatbotScript ?? ''}
</body>
</html>`
}

export function downloadHtml(html: string, filename = 'website.html') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}