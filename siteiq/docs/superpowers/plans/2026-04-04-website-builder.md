# Website Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/codegen` zu einem vollständigen Website Builder mit zwei Modi — bestehende Website verbessern (nutzt Analyse-Daten) oder neue Website von Scratch erstellen — mit Live-Preview (iframe) und ZIP-Export.

**Architecture:** Wizard-State-Machine (mode → configure → builder) auf der bestehenden `/codegen` Route. Split-View: Config-Panel links (240px), iframe Live-Preview rechts. Alle Sections werden parallel via `Promise.all` generiert. Die `/api/codegen` Route wird um `analysisContext` und `newSiteContext` erweitert und bekommt einen Premium-System-Prompt (GSAP, Awwwards-Niveau).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, GSAP (im generierten Output via CDN)

---

## File Map

| Datei | Status | Verantwortung |
|-------|--------|---------------|
| `app/(app)/codegen/page.tsx` | **Rewrite** | Wizard + Split-View Hauptseite |
| `components/builder/WizardStep.tsx` | **Neu** | Wizard UI für "Neue Website" Modus |
| `components/builder/BuilderView.tsx` | **Neu** | Split-View mit Config-Panel + Live-Preview |
| `components/builder/SectionPanel.tsx` | **Neu** | Sections-Auswahl mit ↺ Regenerieren |
| `components/builder/LivePreview.tsx` | **Neu** | iframe Preview + ZIP-Export |
| `app/api/codegen/route.ts` | **Modify** | Premium-Prompt, analysisContext, newSiteContext |
| `components/analysis/AnalysisDashboard.tsx` | **Modify** | "Website verbessern" Button hinzufügen |
| `lib/builder-utils.ts` | **Neu** | assembleHtml() für ZIP-Export |

---

## Task 1: API Route erweitern

**Files:**
- Modify: `app/api/codegen/route.ts`

- [ ] **Schritt 1: Schema erweitern**

Ersetze das bestehende `schema` Objekt in `app/api/codegen/route.ts`:

```typescript
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
```

- [ ] **Schritt 2: System-Prompt auf Premium upgraden**

Ersetze den `system` String im `client.messages.create()` Aufruf:

```typescript
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
```

- [ ] **Schritt 3: Prompt-Logik für beide Modi einbauen**

Ersetze die `prompt` Konstante und alles darunter bis zum `response` Aufruf:

```typescript
const { section, framework, brandDna, analysisContext, newSiteContext } = parsed.data

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
  contextBlock = `
NEUES UNTERNEHMEN:
- Name: ${newSiteContext.businessName}
- Branche: ${newSiteContext.industry}
- Stil: ${{ modern: 'Modern/Minimal — clean, viel Whitespace, starke Typographie', luxury: 'Luxus/Premium — Gold-Akzente, elegante Serif-Fonts, exclusives Feeling', playful: 'Verspielt/Bunt — lebendige Farben, runde Formen, energetisch', corporate: 'Corporate — professionell, vertrauenswürdig, strukturiert' }[newSiteContext.style]}
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
```

- [ ] **Schritt 4: Commit**

```bash
git add app/api/codegen/route.ts
git commit -m "feat: upgrade codegen API with premium prompts, analysisContext, newSiteContext"
```

---

## Task 2: builder-utils — assembleHtml()

**Files:**
- Create: `lib/builder-utils.ts`

- [ ] **Schritt 1: Datei erstellen**

```typescript
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

export function assembleHtml(sections: BuilderSections, businessName = 'Mein Unternehmen'): string {
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

${orderedCode}

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
```

- [ ] **Schritt 2: Commit**

```bash
git add lib/builder-utils.ts
git commit -m "feat: add builder-utils with assembleHtml and downloadHtml helpers"
```

---

## Task 3: LivePreview Komponente

**Files:**
- Create: `components/builder/LivePreview.tsx`

- [ ] **Schritt 1: Komponente erstellen**

```typescript
// components/builder/LivePreview.tsx
'use client'
import { Download, Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { downloadHtml } from '@/lib/builder-utils'

interface LivePreviewProps {
  html: string
  hasContent: boolean
  isGenerating: boolean
}

export function LivePreview({ html, hasContent, isGenerating }: LivePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="flex-1 flex flex-col bg-[#0D0D0D] border border-white/8 rounded-2xl overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#111]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="bg-white/5 rounded px-3 py-1 text-xs text-white/30 min-w-40">
            preview
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewport(v => v === 'desktop' ? 'mobile' : 'desktop')}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            title="Viewport wechseln"
          >
            {viewport === 'desktop' ? <Smartphone size={14} /> : <Monitor size={14} />}
          </button>
          {hasContent && (
            <button
              onClick={() => downloadHtml(html)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
            >
              <Download size={13} />
              ZIP
            </button>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 relative overflow-hidden">
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0D0D0D]">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-sm text-white/30">KI generiert deine Website...</p>
          </div>
        )}
        {!hasContent && !isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
            <Monitor size={40} />
            <p className="text-sm">Live-Vorschau erscheint hier</p>
          </div>
        )}
        <div className={`h-full flex justify-center transition-all duration-300 ${viewport === 'mobile' ? 'bg-[#1a1a1a] p-4' : ''}`}>
          <iframe
            srcDoc={html || '<html><body style="background:#0a0a0a"></body></html>'}
            className={`border-0 transition-all duration-300 ${
              viewport === 'mobile'
                ? 'w-[390px] rounded-xl shadow-2xl border border-white/10'
                : 'w-full h-full'
            }`}
            style={{ height: viewport === 'mobile' ? '100%' : undefined }}
            title="Website Preview"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Schritt 2: Commit**

```bash
git add components/builder/LivePreview.tsx
git commit -m "feat: add LivePreview component with iframe, viewport toggle, ZIP download"
```

---

## Task 4: SectionPanel Komponente

**Files:**
- Create: `components/builder/SectionPanel.tsx`

- [ ] **Schritt 1: Komponente erstellen**

```typescript
// components/builder/SectionPanel.tsx
'use client'
import { RefreshCw, Check } from 'lucide-react'
import { SECTION_ORDER, SECTION_LABELS, type SectionId, type BuilderSections } from '@/lib/builder-utils'

interface SectionPanelProps {
  sections: BuilderSections
  onToggle: (id: SectionId) => void
  onRegenerate: (id: SectionId) => void
}

export function SectionPanel({ sections, onToggle, onRegenerate }: SectionPanelProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Sections</p>
      {SECTION_ORDER.map(id => {
        const s = sections[id]
        const hasCode = s.code.length > 0
        return (
          <div key={id} className="flex items-center gap-2">
            <button
              onClick={() => onToggle(id)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                s.selected
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  : 'bg-white/3 border border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
              }`}
            >
              {hasCode && !s.loading && (
                <Check size={10} className="shrink-0" />
              )}
              {s.loading && (
                <div className="w-2.5 h-2.5 border border-amber-500/50 border-t-amber-400 rounded-full animate-spin shrink-0" />
              )}
              {!hasCode && !s.loading && (
                <div className={`w-2.5 h-2.5 rounded-full border shrink-0 ${s.selected ? 'border-amber-500/50' : 'border-white/20'}`} />
              )}
              {SECTION_LABELS[id]}
            </button>
            {hasCode && !s.loading && (
              <button
                onClick={() => onRegenerate(id)}
                className="p-1.5 rounded-lg text-white/20 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                title="Neu generieren"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Schritt 2: Commit**

```bash
git add components/builder/SectionPanel.tsx
git commit -m "feat: add SectionPanel with toggle, loading state, and regenerate button"
```

---

## Task 5: WizardStep Komponente

**Files:**
- Create: `components/builder/WizardStep.tsx`

- [ ] **Schritt 1: Komponente erstellen**

```typescript
// components/builder/WizardStep.tsx
'use client'
import { motion } from 'framer-motion'
import { type Industry } from '@/types'

export type DesignStyle = 'modern' | 'luxury' | 'playful' | 'corporate'

export interface NewSiteConfig {
  businessName: string
  industry: Industry
  style: DesignStyle
  description: string
}

interface WizardStepProps {
  config: NewSiteConfig
  onChange: (config: NewSiteConfig) => void
  onSubmit: () => void
}

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'agency', label: 'Agentur' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'saas', label: 'SaaS' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'law', label: 'Kanzlei' },
  { value: 'healthcare', label: 'Gesundheit' },
  { value: 'consultant', label: 'Beratung' },
  { value: 'startup', label: 'Startup' },
  { value: 'real-estate', label: 'Immobilien' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'education', label: 'Bildung' },
  { value: 'other', label: 'Sonstiges' },
]

const STYLES: { value: DesignStyle; label: string; desc: string }[] = [
  { value: 'modern', label: 'Modern/Minimal', desc: 'Clean, viel Whitespace, starke Typographie' },
  { value: 'luxury', label: 'Luxus/Premium', desc: 'Gold-Akzente, elegante Fonts, exclusiv' },
  { value: 'playful', label: 'Verspielt/Bunt', desc: 'Lebendige Farben, energetisch, dynamisch' },
  { value: 'corporate', label: 'Corporate', desc: 'Professionell, vertrauenswürdig, strukturiert' },
]

export function WizardStep({ config, onChange, onSubmit }: WizardStepProps) {
  const isValid = config.businessName.trim() && config.description.trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Neue Website erstellen</h2>
        <p className="text-white/40 text-sm">KI generiert deine komplette Website in ~30 Sekunden</p>
      </div>

      {/* Business Name */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider block mb-3">
          Business-Name
        </label>
        <input
          type="text"
          placeholder="z.B. Mayer & Partner Rechtsanwälte"
          value={config.businessName}
          onChange={e => onChange({ ...config, businessName: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/40"
        />
      </div>

      {/* Industry */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider block mb-3">
          Branche
        </label>
        <div className="grid grid-cols-3 gap-2">
          {INDUSTRIES.map(ind => (
            <button
              key={ind.value}
              onClick={() => onChange({ ...config, industry: ind.value })}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                config.industry === ind.value
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/3 text-white/40 border border-white/5 hover:border-white/10 hover:text-white/60'
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* Design Style */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider block mb-3">
          Design-Stil
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map(s => (
            <button
              key={s.value}
              onClick={() => onChange({ ...config, style: s.value })}
              className={`p-3 rounded-xl text-left transition-all ${
                config.style === s.value
                  ? 'bg-amber-500/20 border border-amber-500/30'
                  : 'bg-white/3 border border-white/5 hover:border-white/10'
              }`}
            >
              <div className={`text-sm font-medium mb-0.5 ${config.style === s.value ? 'text-amber-400' : 'text-white/70'}`}>
                {s.label}
              </div>
              <div className="text-xs text-white/30">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider block mb-3">
          Kurzbeschreibung
        </label>
        <textarea
          placeholder="z.B. Wir sind eine Boutique-Kanzlei in München, spezialisiert auf Familienrecht. Zielgruppe: Privatpersonen ab 35."
          value={config.description}
          onChange={e => onChange({ ...config, description: e.target.value })}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/40 resize-none"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!isValid}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
      >
        Website generieren →
      </button>
    </motion.div>
  )
}
```

- [ ] **Schritt 2: Commit**

```bash
git add components/builder/WizardStep.tsx
git commit -m "feat: add WizardStep component for new website configuration"
```

---

## Task 6: Hauptseite — codegen/page.tsx rewrite

**Files:**
- Rewrite: `app/(app)/codegen/page.tsx`

- [ ] **Schritt 1: Seite neu schreiben**

```typescript
// app/(app)/codegen/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, Globe, ArrowLeft } from 'lucide-react'
import { WizardStep, type NewSiteConfig, type DesignStyle } from '@/components/builder/WizardStep'
import { SectionPanel } from '@/components/builder/SectionPanel'
import { LivePreview } from '@/components/builder/LivePreview'
import {
  createInitialSections, assembleHtml,
  type SectionId, type BuilderSections
} from '@/lib/builder-utils'
import type { Analysis } from '@/types'

type Mode = 'improve' | 'new'
type Step = 'select-mode' | 'configure' | 'builder'

const DEFAULT_CONFIG: NewSiteConfig = {
  businessName: '',
  industry: 'agency',
  style: 'modern' as DesignStyle,
  description: '',
}

export default function CodeGenPage() {
  const [step, setStep] = useState<Step>('select-mode')
  const [mode, setMode] = useState<Mode>('new')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [config, setConfig] = useState<NewSiteConfig>(DEFAULT_CONFIG)
  const [sections, setSections] = useState<BuilderSections>(createInitialSections())
  const [framework, setFramework] = useState<'html' | 'nextjs'>('html')
  const [previewHtml, setPreviewHtml] = useState('')
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)

  // Lade Analyse-Daten falls vorhanden
  useEffect(() => {
    const stored = sessionStorage.getItem('latest-analysis')
    if (stored) {
      try {
        const data: Analysis = JSON.parse(stored)
        setAnalysis(data)
      } catch { /* ignore */ }
    }
    // Prüfe ob wir direkt aus dem Dashboard kommen
    const builderMode = sessionStorage.getItem('builder-mode')
    if (builderMode === 'improve') {
      sessionStorage.removeItem('builder-mode')
      setMode('improve')
      setStep('builder')
    }
  }, [])

  // Preview neu zusammensetzen wenn sich Sections ändern
  useEffect(() => {
    const html = assembleHtml(sections, config.businessName || analysis?.url || 'Mein Unternehmen')
    setPreviewHtml(html)
  }, [sections, config.businessName, analysis?.url])

  const generateSection = useCallback(async (id: SectionId) => {
    setSections(prev => ({
      ...prev,
      [id]: { ...prev[id], loading: true },
    }))

    try {
      const body: Record<string, unknown> = {
        section: id,
        framework,
        ...(mode === 'improve' && analysis ? {
          brandDna: analysis.brandDna ? {
            tone: analysis.brandDna.tone,
            usp: analysis.brandDna.usp,
            targetAudience: analysis.brandDna.targetAudience,
            colorPalette: analysis.brandDna.colorPalette,
          } : undefined,
          analysisContext: {
            seoScore: analysis.seo?.score ?? 0,
            designScore: analysis.design?.score ?? 0,
            contentScore: analysis.content?.score ?? 0,
            seoIssues: analysis.seo?.issues ?? [],
            designIssues: analysis.design?.issues ?? [],
            contentIssues: analysis.content?.issues ?? [],
            url: analysis.url,
          },
        } : {
          newSiteContext: {
            businessName: config.businessName,
            industry: config.industry,
            style: config.style,
            description: config.description,
          },
        }),
      }

      const res = await fetch('/api/codegen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setSections(prev => ({
        ...prev,
        [id]: { ...prev[id], code: data.code ?? '', loading: false },
      }))
    } catch {
      setSections(prev => ({
        ...prev,
        [id]: { ...prev[id], loading: false },
      }))
    }
  }, [mode, analysis, config, framework])

  async function generateAll() {
    setIsGeneratingAll(true)
    const selected = Object.entries(sections)
      .filter(([, s]) => s.selected)
      .map(([id]) => id as SectionId)
    await Promise.all(selected.map(id => generateSection(id)))
    setIsGeneratingAll(false)
  }

  function toggleSection(id: SectionId) {
    setSections(prev => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }))
  }

  const anyLoading = Object.values(sections).some(s => s.loading)
  const hasContent = Object.values(sections).some(s => s.code.length > 0)
  const selectedCount = Object.values(sections).filter(s => s.selected).length

  // ─── Mode Selection Screen ───────────────────────────────────────────
  if (step === 'select-mode') {
    return (
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Website <span className="text-amber-400">Builder</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            KI generiert deine komplette Website in Sekunden
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Verbessern */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode('improve'); setStep('builder') }}
            className="group relative p-6 bg-white/3 border border-white/8 rounded-2xl text-left hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
          >
            {analysis && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-amber-400 rounded-full" />
            )}
            <Globe size={24} className="text-amber-400 mb-4" />
            <h3 className="text-white font-semibold mb-1">Bestehende verbessern</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              {analysis
                ? `Nutzt deine Analyse von ${analysis.url}`
                : 'Analysiere zuerst eine Website'}
            </p>
            {analysis && (
              <div className="mt-3 flex gap-2">
                <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-white/40">
                  SEO {analysis.seo?.score ?? '—'}
                </span>
                <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-white/40">
                  Design {analysis.design?.score ?? '—'}
                </span>
              </div>
            )}
          </motion.button>

          {/* Neu erstellen */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode('new'); setStep('configure') }}
            className="group p-6 bg-white/3 border border-white/8 rounded-2xl text-left hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
          >
            <Wand2 size={24} className="text-amber-400 mb-4" />
            <h3 className="text-white font-semibold mb-1">Neue Website erstellen</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              Von Scratch — KI generiert alles auf Basis deiner Angaben
            </p>
          </motion.button>
        </div>
      </div>
    )
  }

  // ─── Wizard (nur für "Neu erstellen") ────────────────────────────────
  if (step === 'configure') {
    return (
      <div className="p-8 max-w-xl">
        <button
          onClick={() => setStep('select-mode')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Zurück
        </button>
        <WizardStep
          config={config}
          onChange={setConfig}
          onSubmit={() => setStep('builder')}
        />
      </div>
    )
  }

  // ─── Builder (Split-View) ─────────────────────────────────────────────
  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('select-mode')}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            <ArrowLeft size={14} /> Zurück
          </button>
          <h1 className="text-lg font-bold text-white">
            Website <span className="text-amber-400">Builder</span>
          </h1>
          {mode === 'improve' && analysis && (
            <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full">
              Verbessert: {analysis.url}
            </span>
          )}
          {mode === 'new' && config.businessName && (
            <span className="text-xs bg-white/5 border border-white/10 text-white/60 px-2.5 py-1 rounded-full">
              {config.businessName}
            </span>
          )}
        </div>
        {/* Framework toggle */}
        <div className="flex gap-1.5">
          {(['html', 'nextjs'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFramework(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                framework === f
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/3 text-white/40 border border-white/5 hover:text-white/60'
              }`}
            >
              {f === 'html' ? 'HTML' : 'Next.js'}
            </button>
          ))}
        </div>
      </div>

      {/* Split View */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-56 flex flex-col gap-4 shrink-0">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex-1 overflow-auto">
            {/* Analysis badge */}
            {mode === 'improve' && analysis && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs font-medium text-amber-400 mb-1">Analyse geladen</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-white/40">SEO {analysis.seo?.score}</span>
                  <span className="text-xs text-white/40">Design {analysis.design?.score}</span>
                  <span className="text-xs text-white/40">Content {analysis.content?.score}</span>
                </div>
              </div>
            )}

            <SectionPanel
              sections={sections}
              onToggle={toggleSection}
              onRegenerate={generateSection}
            />
          </div>

          <button
            onClick={generateAll}
            disabled={anyLoading || selectedCount === 0}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isGeneratingAll ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Generiert...
              </>
            ) : (
              <>⚡ Alle generieren ({selectedCount})</>
            )}
          </button>
        </div>

        {/* Right Panel — Live Preview */}
        <LivePreview
          html={previewHtml}
          hasContent={hasContent}
          isGenerating={anyLoading}
        />
      </div>
    </div>
  )
}
```

- [ ] **Schritt 2: Verzeichnis für Builder-Komponenten anlegen**

```bash
mkdir -p "/Users/francescogiudice/Documents/Website /siteiq/components/builder"
```

- [ ] **Schritt 3: TypeScript prüfen**

```bash
cd "/Users/francescogiudice/Documents/Website /siteiq" && npx tsc --noEmit 2>&1 | head -30
```

Erwartung: keine Fehler (oder nur unkritische Warnungen)

- [ ] **Schritt 4: Commit**

```bash
git add app/(app)/codegen/page.tsx components/builder/
git commit -m "feat: rewrite codegen page as full Website Builder with wizard + split-view"
```

---

## Task 7: "Website verbessern" Button im AnalysisDashboard

**Files:**
- Modify: `components/analysis/AnalysisDashboard.tsx`

- [ ] **Schritt 1: Button hinzufügen**

In `components/analysis/AnalysisDashboard.tsx`, finde die Zeile mit `router.push('/content')` und ergänze einen weiteren Button davor:

```typescript
// Vorhandener Buttons-Block ersetzen:
<div className="flex gap-3">
  <Button variant="secondary" size="sm" onClick={() => {
    sessionStorage.setItem('builder-mode', 'improve')
    router.push('/codegen')
  }}>
    Website verbessern
  </Button>
  <Button variant="secondary" size="sm" onClick={() => router.push('/content')}>
    Content generieren
  </Button>
  <Button size="sm" onClick={() => router.push('/')}>
    Neue Analyse
  </Button>
</div>
```

- [ ] **Schritt 2: Commit**

```bash
git add components/analysis/AnalysisDashboard.tsx
git commit -m "feat: add 'Website verbessern' button to AnalysisDashboard"
```

---

## Task 8: Smoke-Test & Finale Prüfung

- [ ] **Schritt 1: Dev-Server starten**

```bash
cd "/Users/francescogiudice/Documents/Website /siteiq" && npm run dev
```

- [ ] **Schritt 2: Modus-Auswahl testen**

Öffne `http://localhost:3000/codegen` — beide Cards (Verbessern + Neu erstellen) sollen erscheinen.

- [ ] **Schritt 3: Neues Website Flow testen**

Klick auf "Neue Website erstellen" → Wizard ausfüllen → "Website generieren" → Split-View erscheint → "Alle generieren" klicken → Sections laden parallel → Live-Preview zeigt fertige Website.

- [ ] **Schritt 4: ZIP-Export testen**

ZIP-Button in der Preview klicken → `website.html` wird heruntergeladen → Im Browser öffnen → Sieht gut aus.

- [ ] **Schritt 5: Verbessern-Flow testen**

Zurück zu `/` → Website analysieren → Im Dashboard "Website verbessern" klicken → Builder öffnet direkt mit Analyse-Badge → Sections generieren → Korrekte Analyse-Daten im Prompt.

- [ ] **Schritt 6: Mobil-Viewport testen**

Smartphone-Icon in der Preview klicken → Website rendert in 390px Breite.

- [ ] **Schritt 7: Finaler Commit**

```bash
git add -A && git commit -m "feat: Website Builder complete — improve existing + create new, live preview, ZIP export"
```

---

## Task 9: KI-Chatbot Integration in den Website Builder

**Files:**
- Modify: `lib/builder-utils.ts` — `assembleHtml()` bekommt optionalen `chatbotScript` Parameter
- Modify: `app/(app)/codegen/page.tsx` — Chatbot-Toggle + Generierungs-Logik
- Modify: `components/builder/SectionPanel.tsx` — Chatbot-Toggle am Ende der Section-Liste

**Kontext:** Der bestehende `/api/chatbot/generate` Endpoint gibt bereits ein vollständiges Konfigurationsobjekt zurück (`systemPrompt`, `greeting`, `faqs`, `name` etc.). Wir nutzen diesen Endpoint direkt.

- [ ] **Schritt 1: `assembleHtml()` um Chatbot-Script erweitern**

In `lib/builder-utils.ts` den Funktions-Signature ändern:

```typescript
export function assembleHtml(
  sections: BuilderSections,
  businessName = 'Mein Unternehmen',
  chatbotScript?: string  // neu
): string {
  // ... existing code ...

  // Vor dem schließenden </body> Tag einfügen:
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <!-- ... existing head ... -->
</head>
<body>

${orderedCode}

<script>
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('[data-gsap]').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 0, y: 30, duration: 0.8, ease: 'power2.out'
    });
  });
</script>

${chatbotScript ?? ''}
</body>
</html>`
}
```

- [ ] **Schritt 2: Chatbot-Toggle State in `codegen/page.tsx` hinzufügen**

Direkt unter den bestehenden State-Variablen ergänzen:

```typescript
const [chatbotEnabled, setChatbotEnabled] = useState(false)
const [chatbotScript, setChatbotScript] = useState('')
const [chatbotLoading, setChatbotLoading] = useState(false)
```

Und eine neue `generateChatbot()` Funktion:

```typescript
async function generateChatbot() {
  if (!chatbotEnabled) return
  setChatbotLoading(true)
  try {
    const res = await fetch('/api/chatbot/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteContent: mode === 'improve' && analysis
          ? `${analysis.url} - ${analysis.brandDna?.usp} - Branche: ${analysis.industry}`
          : `${config.businessName} - ${config.description} - Branche: ${config.industry}`,
        industry: mode === 'improve' ? analysis?.industry : config.industry,
        brandDna: mode === 'improve'
          ? (analysis?.brandDna ?? { tone: 'professionell', usp: '', targetAudience: '', values: [] })
          : { tone: config.style, usp: config.description, targetAudience: '', values: [] },
      }),
    })
    const chatbotConfig = await res.json()
    // Embed-Script aus der generierten Config zusammenbauen
    const script = `
<!-- KI-Chatbot by SiteIQ -->
<script>
  window.__CHATBOT_CONFIG__ = ${JSON.stringify({
    name: chatbotConfig.name,
    greeting: chatbotConfig.greeting,
    systemPrompt: chatbotConfig.systemPrompt,
  })};
</script>
<style>
  #siteiq-chat-toggle {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    width: 56px; height: 56px; border-radius: 50%;
    background: #F59E0B; border: none; cursor: pointer;
    box-shadow: 0 4px 24px rgba(245,158,11,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; transition: transform 0.2s;
  }
  #siteiq-chat-toggle:hover { transform: scale(1.1); }
  #siteiq-chat-window {
    display: none; position: fixed; bottom: 96px; right: 24px;
    width: 360px; height: 480px; background: #111; border-radius: 16px;
    border: 1px solid #333; z-index: 9998; flex-direction: column;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6); overflow: hidden;
  }
  #siteiq-chat-window.open { display: flex; }
  #siteiq-chat-header {
    background: #1a1a1a; padding: 16px; border-bottom: 1px solid #222;
    color: #fff; font-weight: 600; font-size: 14px; display: flex;
    align-items: center; gap: 8px;
  }
  #siteiq-chat-messages {
    flex: 1; overflow-y: auto; padding: 16px; display: flex;
    flex-direction: column; gap: 8px;
  }
  .siteiq-msg { padding: 10px 14px; border-radius: 12px; font-size: 13px; max-width: 80%; }
  .siteiq-msg.bot { background: #1a1a1a; color: #fff; align-self: flex-start; }
  .siteiq-msg.user { background: #F59E0B; color: #000; align-self: flex-end; font-weight: 500; }
  #siteiq-chat-input-row {
    padding: 12px; border-top: 1px solid #222; display: flex; gap: 8px;
  }
  #siteiq-chat-input {
    flex: 1; background: #222; border: 1px solid #333; border-radius: 8px;
    padding: 8px 12px; color: #fff; font-size: 13px; outline: none;
  }
  #siteiq-chat-send {
    background: #F59E0B; color: #000; border: none; border-radius: 8px;
    padding: 8px 14px; font-weight: 600; cursor: pointer; font-size: 13px;
  }
</style>
<button id="siteiq-chat-toggle" onclick="document.getElementById('siteiq-chat-window').classList.toggle('open')">💬</button>
<div id="siteiq-chat-window">
  <div id="siteiq-chat-header">
    <span>🤖</span> ${chatbotConfig.name ?? 'Assistent'}
  </div>
  <div id="siteiq-chat-messages">
    <div class="siteiq-msg bot">${chatbotConfig.greeting ?? 'Hallo! Wie kann ich helfen?'}</div>
  </div>
  <div id="siteiq-chat-input-row">
    <input id="siteiq-chat-input" placeholder="Nachricht eingeben..." onkeydown="if(event.key==='Enter')document.getElementById('siteiq-chat-send').click()">
    <button id="siteiq-chat-send" onclick="(function(){
      const input=document.getElementById('siteiq-chat-input');
      const msgs=document.getElementById('siteiq-chat-messages');
      if(!input.value.trim())return;
      const userMsg=document.createElement('div');
      userMsg.className='siteiq-msg user';
      userMsg.textContent=input.value;
      msgs.appendChild(userMsg);
      input.value='';
      msgs.scrollTop=msgs.scrollHeight;
    })()">→</button>
  </div>
</div>`
    setChatbotScript(script)
  } finally {
    setChatbotLoading(false)
  }
}
```

- [ ] **Schritt 3: `generateAll()` um Chatbot erweitern**

Die bestehende `generateAll()` Funktion ergänzen:

```typescript
async function generateAll() {
  setIsGeneratingAll(true)
  const selected = Object.entries(sections)
    .filter(([, s]) => s.selected)
    .map(([id]) => id as SectionId)
  // Sections und Chatbot parallel generieren
  await Promise.all([
    ...selected.map(id => generateSection(id)),
    chatbotEnabled ? generateChatbot() : Promise.resolve(),
  ])
  setIsGeneratingAll(false)
}
```

- [ ] **Schritt 4: Chatbot-Toggle im Config-Panel hinzufügen**

In `components/builder/SectionPanel.tsx` am Ende nach der letzten Section:

```typescript
interface SectionPanelProps {
  // ... existing ...
  chatbotEnabled: boolean
  chatbotLoading: boolean
  onChatbotToggle: () => void
}

// Am Ende der return-Anweisung, nach den Sections:
<div className="mt-4 pt-4 border-t border-white/5">
  <button
    onClick={onChatbotToggle}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
      chatbotEnabled
        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
        : 'bg-white/3 border border-white/5 text-white/40 hover:border-white/10'
    }`}
  >
    {chatbotLoading ? (
      <div className="w-2.5 h-2.5 border border-amber-500/50 border-t-amber-400 rounded-full animate-spin shrink-0" />
    ) : (
      <span>🤖</span>
    )}
    KI-Chatbot einbetten
  </button>
  {chatbotEnabled && (
    <p className="text-xs text-white/30 mt-1.5 px-1">
      Widget wird automatisch in den ZIP eingebettet
    </p>
  )}
</div>
```

- [ ] **Schritt 5: Preview mit chatbotScript verknüpfen**

In `codegen/page.tsx` den `useEffect` für Preview aktualisieren:

```typescript
useEffect(() => {
  const html = assembleHtml(
    sections,
    config.businessName || analysis?.url || 'Mein Unternehmen',
    chatbotEnabled ? chatbotScript : undefined  // neu
  )
  setPreviewHtml(html)
}, [sections, config.businessName, analysis?.url, chatbotScript, chatbotEnabled])
```

- [ ] **Schritt 6: Props an SectionPanel übergeben**

Im Builder Split-View, `<SectionPanel>` Props ergänzen:

```typescript
<SectionPanel
  sections={sections}
  onToggle={toggleSection}
  onRegenerate={generateSection}
  chatbotEnabled={chatbotEnabled}
  chatbotLoading={chatbotLoading}
  onChatbotToggle={() => setChatbotEnabled(v => !v)}
/>
```

- [ ] **Schritt 7: Testen**

Chatbot-Toggle aktivieren → "Alle generieren" → Preview zeigt Chat-Widget unten rechts → ZIP herunterladen → HTML öffnen → Widget ist sichtbar und funktionstüchtig.

- [ ] **Schritt 8: Commit**

```bash
git add app/(app)/codegen/page.tsx components/builder/SectionPanel.tsx lib/builder-utils.ts
git commit -m "feat: embed AI chatbot widget into generated website via Website Builder"
```
