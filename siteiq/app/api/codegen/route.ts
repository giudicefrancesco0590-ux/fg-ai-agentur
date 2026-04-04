import { NextRequest, NextResponse } from 'next/server'
import { createClaudeClient } from '@/lib/claude'
import { z } from 'zod'

const schema = z.object({
  section: z.enum(['hero', 'cta', 'nav', 'footer', 'contact', 'services', 'testimonials', 'pricing']),
  framework: z.enum(['html', 'nextjs']),
  brandDna: z.object({
    tone: z.string(),
    usp: z.string(),
    targetAudience: z.string(),
    colorPalette: z.array(z.string()).optional(),
  }).optional(),
  analysisContext: z.object({
    seoScore: z.number(),
    designScore: z.number(),
    contentScore: z.number(),
    seoIssues: z.array(z.string()),
    designIssues: z.array(z.string()),
    contentIssues: z.array(z.string()),
    url: z.string(),
  }).optional(),
  newSiteContext: z.object({
    businessName: z.string(),
    industry: z.string(),
    style: z.enum(['modern', 'luxury', 'playful', 'corporate']),
    description: z.string(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { section, framework, brandDna, analysisContext, newSiteContext } = parsed.data
  const client = createClaudeClient()

  const sectionNames: Record<string, string> = {
    hero: 'Hero-Sektion',
    cta: 'Call-to-Action-Sektion',
    nav: 'Sticky Navigation mit Logo und Links',
    footer: 'Footer mit Links, Social Media, Copyright',
    contact: 'Kontaktformular mit Feldern und Submit-Button',
    services: 'Leistungen/Services-Sektion mit 3-4 Cards',
    testimonials: 'Kundenstimmen/Testimonials mit Zitaten und Namen',
    pricing: 'Preistabelle mit 2-3 Paketen und CTA-Buttons',
  }

  const frameworkNote = framework === 'nextjs'
    ? 'Next.js 15 TypeScript Komponente. Nutze Framer Motion für Animationen (import { motion } from "framer-motion"). Tailwind CSS Klassen. Exportiere als default export.'
    : 'Vanilla HTML. Nutze GSAP + ScrollTrigger via CDN (bereits im <head> geladen). Tailwind via CDN Play. Inline alle Styles.'

  let contextBlock = ''

  if (analysisContext) {
    contextBlock = `
ANALYSE-KONTEXT (diese Probleme gezielt beheben):
- SEO Score: ${analysisContext.seoScore}/100
  Probleme: ${analysisContext.seoIssues.slice(0, 3).join(', ')}
- Design Score: ${analysisContext.designScore}/100
  Probleme: ${analysisContext.designIssues.slice(0, 3).join(', ')}
- Content Score: ${analysisContext.contentScore}/100
  Probleme: ${analysisContext.contentIssues.slice(0, 3).join(', ')}
- Website: ${analysisContext.url}

${brandDna ? `Brand DNA:
- Ton: ${brandDna.tone}
- USP: ${brandDna.usp}
- Zielgruppe: ${brandDna.targetAudience}
- Farben: ${brandDna.colorPalette?.join(', ') ?? '#0A0A0A, #F59E0B'}` : ''}`
  }

  if (newSiteContext) {
    const styleDescriptions: Record<string, string> = {
      modern: 'Modern/Minimal — clean, viel Whitespace, starke Typographie',
      luxury: 'Luxus/Premium — Gold-Akzente, elegante Serif-Fonts, exclusives Feeling',
      playful: 'Verspielt/Bunt — lebendige Farben, runde Formen, energetisch',
      corporate: 'Corporate — professionell, vertrauenswürdig, strukturiert',
    }
    contextBlock = `
NEUES UNTERNEHMEN:
- Name: ${newSiteContext.businessName}
- Branche: ${newSiteContext.industry}
- Stil: ${styleDescriptions[newSiteContext.style]}
- Beschreibung: ${newSiteContext.description}`
  }

  const prompt = `Erstelle eine ${sectionNames[section]} auf Awwwards-Niveau.
${contextBlock}

Framework: ${frameworkNote}

Anforderungen:
- Konversionsoptimiert mit klarem CTA
- Scroll-Animationen mit GSAP (HTML) oder Framer Motion (Next.js)
- Premium Typography: große Headlines, starke visuelle Hierarchie
- Micro-interactions auf hover/focus States
- Vollständig mobil-responsiv

Gib NUR den fertigen Code zurück. Kein Markdown. Direkt mit dem Code beginnen.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `Du bist ein Awwwards-Niveau Frontend-Entwickler. Spezialisiert auf premium, distinctive Webdesign.

REGELN:
- Gib NUR Code zurück — kein Markdown, keine Erklärungen, kein \`\`\`
- Dark Mode: #0A0A0A Background, #F59E0B Gold/Amber Akzente
- Keine generischen AI-Aesthetics — bold, distinctive Design
- GSAP ScrollTrigger via CDN für Animationen (data-gsap Attribute setzen)
- Tailwind CSS via CDN Play (class="...")
- Mobile-first, vollständig responsiv
- Jede Section muss für sich allein stehen können (kein externer CSS-Import nötig)
- Inline alle notwendigen Styles im <style> Tag der Section`,
    messages: [{ role: 'user', content: prompt }],
  })

  const code = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ code })
}
