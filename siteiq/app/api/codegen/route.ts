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

const SYSTEM_PROMPT = `You are an elite frontend engineer who builds award-winning websites for top agencies like Fantasy, Instrument, and Huge. Your output has won Awwwards SOTD multiple times.

ABSOLUTE RULES — NEVER BREAK THESE:
1. Return ONLY raw HTML code. Zero markdown. Zero backticks. Zero explanations. Start directly with the HTML tag or <section>.
2. Every section is self-contained: all CSS in a <style> tag, all JS in a <script> tag within the section.
3. GSAP + ScrollTrigger are already loaded in the <head>. Use them for every animation.
4. Tailwind CDN is already loaded. Use Tailwind utility classes.
5. Never use placeholder images (no picsum, no unsplash). Use SVG illustrations, CSS shapes, or gradient backgrounds instead.

DESIGN PHILOSOPHY — MANDATORY:
- Dark, cinematic aesthetic: deep blacks (#050505, #080808, #0A0A0A), NOT generic gray (#1a1a1a)
- Violet/purple accent system: #7C3AED (primary), #8B5CF6 (mid), #A78BFA (light), #C4B5FD (subtle)
- Typography is architecture: mix large (clamp(60px,8vw,120px)) display text with tiny (11px) labels
- Visual contrast: pair ultra-thin elements with ultra-bold ones
- Every interactive element has a micro-interaction (hover transform, color shift, border glow)
- Glassmorphism where appropriate: backdrop-filter: blur(20px), bg rgba(255,255,255,0.04)
- Grain texture on hero sections: use SVG filter feTurbulence for noise
- Gradient mesh backgrounds: use radial-gradient overlays at 10-20% opacity
- Split typography: some words in gradient text (background-clip: text)
- Use CSS custom properties for the color system

ANIMATION REQUIREMENTS:
- Hero: staggered entrance (each element 0.1s delay), optional floating particle effect
- Services/Features: cards stagger in from bottom with ScrollTrigger
- Testimonials: horizontal marquee or fade-in quotes
- Pricing: cards scale up on hover with glow shadow
- Nav: blur background on scroll, hide on scroll down, show on scroll up
- Use GSAP timeline for sequenced animations, not just individual gsap.from() calls

TYPOGRAPHY SYSTEM:
- Display font: use CSS @import for a premium font (Syne, Outfit, or DM Sans from Google Fonts)
- Headlines: font-weight 700-900, letter-spacing negative (-0.02em to -0.04em)
- Body: font-weight 300-400, line-height 1.6-1.8
- Labels/caps: font-weight 500, letter-spacing 0.15em, text-transform uppercase, font-size 11px

LAYOUT PATTERNS TO USE:
- Asymmetric grids (not equal columns)
- Large negative space around key elements
- Full-bleed sections with contained content (max-w-7xl mx-auto px-8)
- Sticky elements, overlapping layers, z-index depth
- Border accents: 1px solid rgba(255,255,255,0.06) for subtle separation`

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { section, brandDna, analysisContext, newSiteContext } = parsed.data
  const client = createClaudeClient()

  // Build context
  let businessName = 'Mein Unternehmen'
  let industry = 'Dienstleistung'
  let style = 'modern'
  let description = ''
  let colorPrimary = '#7C3AED'

  if (newSiteContext) {
    businessName = newSiteContext.businessName
    industry = newSiteContext.industry
    style = newSiteContext.style
    description = newSiteContext.description
  }

  if (brandDna) {
    if (brandDna.colorPalette?.[0]) colorPrimary = brandDna.colorPalette[0]
  }

  const styleMap: Record<string, string> = {
    modern: 'ultra-modern minimal — massive negative space, mono or duotone palette, geometric precision, brutalist-inspired typography',
    luxury: 'luxury premium — champagne/gold gradients (#C9A84C, #E8D5A3), serif display fonts (Playfair Display), refined micro-details, velvet-dark backgrounds',
    playful: 'energetic & bold — vibrant gradients (purple to cyan), rounded corners (border-radius: 24px+), playful iconography, kinetic animations',
    corporate: 'executive corporate — navy/slate palette, trustworthy, structured grid, clean sans-serif, data-driven visual elements',
  }

  const styleDescription = styleMap[style] || styleMap.modern

  let contextBlock = `BUSINESS CONTEXT:
- Company: ${businessName}
- Industry: ${industry}
- Visual Style: ${styleDescription}
- Description: ${description || 'Premium service provider'}
- Primary Color: ${colorPrimary}`

  if (analysisContext) {
    contextBlock += `

IMPROVEMENT PRIORITIES (fix these specific issues):
- SEO Score was ${analysisContext.seoScore}/100 — fix: ${analysisContext.seoIssues.slice(0, 2).join(', ')}
- Design Score was ${analysisContext.designScore}/100 — fix: ${analysisContext.designIssues.slice(0, 2).join(', ')}
- Content Score was ${analysisContext.contentScore}/100 — fix: ${analysisContext.contentIssues.slice(0, 2).join(', ')}
- Original site: ${analysisContext.url}`

    if (brandDna) {
      contextBlock += `
- Brand tone: ${brandDna.tone}
- USP: ${brandDna.usp}
- Target audience: ${brandDna.targetAudience}`
    }
  }

  const sectionPrompts: Record<string, string> = {
    nav: `Build a STICKY NAVIGATION BAR that:
- Logo: "${businessName}" in bold 18px, with a small geometric accent mark before it
- Right side: 4 nav links (Leistungen, Über uns, Referenzen, Kontakt) + a CTA button with violet border-glow
- On scroll: backdrop-filter blur(20px), border-bottom 1px solid rgba(255,255,255,0.06), background darkens
- Hide on scroll down, reveal on scroll up (GSAP ScrollTrigger)
- Mobile: hamburger menu that slides in from right with staggered link animation
- Height: 64px, position: fixed, top: 0, z-index: 1000, width: 100%`,

    hero: `Build a HERO SECTION that makes designers stop scrolling. Requirements:
- Full viewport height (min-height: 100vh)
- Large display headline (clamp(52px,7vw,110px)) with the business name and a punchy 2-line tagline
- Gradient text on key words (background: linear-gradient(135deg, #8B5CF6, #C4B5FD); -webkit-background-clip: text)
- Subtle grain texture overlay (SVG feTurbulence filter, opacity 0.04)
- Two radial gradient orbs (violet, low opacity) as background atmosphere
- Entrance animation: GSAP timeline — badge fades in first, then headline words stagger, then subtext, then CTA buttons
- Two CTA buttons: primary (filled violet gradient) + secondary (ghost with arrow →)
- Optional floating stat badges: "30s Analyse", "100% KI" in glass cards
- Scroll indicator at bottom (animated chevron or line)`,

    services: `Build a SERVICES/FEATURES SECTION that looks like it's from a $50k agency site:
- Section headline: small caps label above, large title below
- Grid: 3 or 4 feature cards in an asymmetric layout (not equal columns — try 2+1 or staggered grid)
- Each card: glass background (backdrop-blur), violet icon (SVG inline), title, 2-line description
- Hover: card border brightens to violet, slight translateY(-4px), box-shadow glow
- Cards stagger in from bottom with ScrollTrigger (0.1s stagger)
- Include one "featured" card that's larger and has a gradient border`,

    testimonials: `Build a TESTIMONIALS SECTION:
- Section intro: eyebrow label + headline
- Layout: horizontal scrolling marquee (infinite loop via CSS animation) OR 3-column grid
- Each testimonial: large quote mark (80px, violet, opacity 0.3), quote text (18px), avatar circle (gradient placeholder), name + role + company
- Rating: 5 gold stars (★★★★★) above each quote
- Background: slightly lighter than body (#0D0D0D), subtle grid overlay
- Marquee animation: smooth infinite scroll, pause on hover`,

    pricing: `Build a PRICING SECTION with 3 tiers:
- Starter (~€299/mo), Professional (~€699/mo, FEATURED), Enterprise (custom)
- Featured card: violet gradient border, "Empfohlen" badge, slightly larger, glow shadow
- Each card: plan name, price, feature list (6-8 items with ✓ checkmarks), CTA button
- Feature list: included features in white, unavailable in white/30
- Hover on non-featured cards: border brightens, slight scale(1.02)
- Cards animate in with stagger on scroll`,

    cta: `Build a CALL-TO-ACTION SECTION — the conversion moment:
- Full-width section with a dramatic violet-to-purple gradient or mesh gradient background
- Giant headline (clamp(40px,5vw,80px)) — short, punchy, 1-2 lines max
- Subtext: 1 sentence value proposition
- Two large buttons side by side
- Optional: floating social proof element ("Bereits 500+ Unternehmen vertrauen uns")
- Animated background: GSAP-driven gradient shift or floating particle dots
- This section should feel urgent and exciting`,

    contact: `Build a CONTACT SECTION:
- Two-column layout: left side has headline + description + contact details (email, phone, address with icons), right side has the form
- Form fields: Name, E-Mail, Nachricht (textarea), Submit button
- Fields: glass style (bg rgba(255,255,255,0.04), border rgba(255,255,255,0.08), backdrop-blur)
- Focus state: violet border glow, label floats up (CSS only floating label pattern)
- Submit button: full-width, violet gradient, hover: brightness + scale
- On right side background: subtle violet glow blob`,

    footer: `Build a FOOTER:
- 4-column grid: Logo+description, Links (Leistungen, Über uns, Blog, Kontakt), Rechtliches (Impressum, Datenschutz, AGB), Newsletter signup
- Newsletter: email input + "Anmelden" button inline
- Bottom bar: copyright © ${new Date().getFullYear()} ${businessName}, social media icons (LinkedIn, Instagram, Twitter/X) as inline SVGs
- Top border: 1px gradient line (transparent → violet → transparent)
- Subtle background: slightly different from body, optional dot grid
- All links: hover color transition to violet`,
  }

  const sectionPrompt = sectionPrompts[section] || `Build a premium ${section} section.`

  const fullPrompt = `${contextBlock}

SECTION TO BUILD:
${sectionPrompt}

TECHNICAL REQUIREMENTS:
- Self-contained HTML (no external CSS imports needed beyond what's already in <head>)
- All custom CSS in a <style> tag at the top of your output
- All custom JS in a <script> tag at the bottom of your output
- Use Google Fonts import in your <style> for premium typography (Syne or Outfit)
- Tailwind classes for layout, custom CSS for effects (gradients, glows, animations)
- GSAP + ScrollTrigger for entrance animations (gsap object is globally available)
- Full mobile responsiveness — use CSS Grid/Flexbox + Tailwind responsive prefixes
- German language content (${businessName}, ${industry})

OUTPUT: Only the HTML/CSS/JS code for this section. Nothing else.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: fullPrompt }],
  })

  const code = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ code })
}
