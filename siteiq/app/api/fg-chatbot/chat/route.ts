import { NextRequest, NextResponse } from 'next/server'
import { createClaudeClient } from '@/lib/claude'
import { z } from 'zod'

const schema = z.object({
  message: z.string().max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(30).default([]),
  leadData: z.object({
    name: z.string().optional(),
    company: z.string().optional(),
    industry: z.string().optional(),
    challenge: z.string().optional(),
    budget: z.string().optional(),
    timeline: z.string().optional(),
  }).optional(),
})

const SYSTEM_PROMPT = `Du bist der KI-Assistent von FG AI Agentur — einer spezialisierten Digitalagentur, die KI-Lösungen für kleine und mittlere Unternehmen entwickelt.

ÜBER FG AI AGENTUR:
- Gründer: Francesco Giudice
- Spezialisierung: KI-Chatbots, Voice Agents, Website-Erstellung, Lead-Generierung
- Zielkunden: Gastronomie, Handwerksbetriebe, Dienstleister, Coaches, Immobilienmakler
- Standort: Deutschland
- Kontakt: info@master-closing.de | Tel: 0175 1538745
- Calendly: https://calendly.com/giudicefrancesco0590/30min

LEISTUNGEN & PREISE:
1. **KI-Chatbot** — Auf Anfrage (individuell)
   - 24/7 automatische Antworten auf Ihrer Website
   - Auf Ihr Unternehmen trainiert (Speisekarte, FAQs, Services)
   - Lead-Erfassung & Weiterleitung
   - Reservierungen & Terminbuchungen
   - Geeignet für Restaurants, Handwerker, Büros jeder Art

2. **Voice Agent + Website** — Auf Anfrage (beliebteste Wahl)
   - Moderne, mobil-optimierte Website
   - KI-Voice-Agent am Telefon 24/7
   - Nimmt Anrufe entgegen, beantwortet Fragen, trägt Reservierungen ein
   - Ideal für Gastronomie & Handwerker
   - Support & laufende Optimierung

3. **Komplett-System** — Auf Anfrage
   - Website + Chatbot + Voice Agent + Lead-Generierung
   - Vollständig automatisiert & vernetzt
   - Kalender-Integration (automatische Terminbuchung)
   - Maßgeschneidert für jede Branche
   - Persönliche Betreuung

4. **KI Lead-Generierung** — Auf Anfrage
   - KI spricht Besucher aktiv an
   - Sammelt Kontaktdaten automatisch
   - Übergibt warme Leads direkt an Sie

5. **Website-Erstellung** — Auf Anfrage
   - Professionelle, blitzschnelle Websites
   - Mobil-optimiert, modern, individuell
   - Mit Speisekarte, Galerie, Leistungsübersicht

TYPISCHE KUNDEN-BRANCHEN:
- Restaurants & Gastronomie (Reservierungen, Speisekarten, FAQs)
- Handwerksbetriebe (Anfragen, Terminbuchungen, Portfolios)
- Coaches & Berater (Lead-Qualifizierung, Erstgespräche)
- Immobilienmakler (Lead-Nurturing, Exposé-Anfragen)
- Arztpraxen & Dienstleister (Terminbuchungen, Patientenanfragen)

ALLEINSTELLUNGSMERKMALE:
- Alles aus einer Hand — Entwicklung, Training, Einbindung, Support
- Schnelle Umsetzung (1-2 Wochen für einfache Projekte)
- Individuelle Lösungen, keine Baukastensysteme
- 24/7 verfügbar nach Einrichtung — kein Personal nötig
- Messbare Ergebnisse: mehr Anfragen, weniger manuelle Arbeit

LEAD-QUALIFIZIERUNGS-AUFGABE:
Du hast zwei Hauptaufgaben:
1. Fragen über FG AI Agentur und ihre Leistungen beantworten
2. Interessenten qualifizieren, indem du im Gesprächsverlauf natürlich folgende Infos sammelst:
   - Name und Unternehmen
   - Branche (Restaurant, Handwerker, etc.)
   - Größte Herausforderung/Problem, das gelöst werden soll
   - Zeitrahmen (wann soll gestartet werden?)

Wenn du genug Infos gesammelt hast (mindestens Name, Branche, Herausforderung), empfiehl das passende Paket und lade zum kostenlosen Erstgespräch ein mit: "https://calendly.com/giudicefrancesco0590/30min"

VERHALTENSGRUNDSÄTZE:
- Antworte IMMER auf Deutsch
- Sei freundlich, professionell und direkt — kein Bullshit
- Halte Antworten kurz (2-4 Sätze), außer bei komplexen Fragen
- Stelle maximal 1 Qualifizierungsfrage pro Antwort
- Wenn jemand den Preis fragt: Erkläre dass Preise individuell kalkuliert werden und ein kostenloses 30-minütiges Erstgespräch der erste Schritt ist
- Wenn jemand sofort buchen will: Gib direkt den Calendly-Link
- Sei kein nerviger Verkäufer — hilf zuerst, qualifiziere dabei`

export async function POST(req: NextRequest) {
  // CORS für fg-ai-agentur.de
  const origin = req.headers.get('origin') || ''
  const allowedOrigins = [
    'https://fg-ai-agentur.de',
    'https://www.fg-ai-agentur.de',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
  ]
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400, headers: corsHeaders })
    }

    const { message, history, leadData } = parsed.data
    const client = createClaudeClient()

    // Add lead context to system prompt if available
    let systemPrompt = SYSTEM_PROMPT
    if (leadData && Object.keys(leadData).length > 0) {
      const known = Object.entries(leadData)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      systemPrompt += `\n\nBEREITS BEKANNTE LEAD-DATEN: ${known}\nDiese Infos brauchst du nicht nochmal zu fragen.`
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract lead info from response context
    return NextResponse.json({ text }, { headers: corsHeaders })
  } catch (err) {
    console.error('FG Chatbot error:', err)
    return NextResponse.json(
      { error: 'Fehler beim Verarbeiten der Anfrage' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  const allowedOrigins = ['https://fg-ai-agentur.de', 'https://www.fg-ai-agentur.de', 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500']
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
