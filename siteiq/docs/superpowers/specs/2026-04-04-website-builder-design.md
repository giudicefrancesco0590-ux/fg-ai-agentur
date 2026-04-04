# Website Builder — Design Spec
**Datum:** 2026-04-04  
**Feature:** Website Builder in SiteIQ App  
**Status:** Approved

---

## Übersicht

Der Website Builder ersetzt die bestehende `/codegen` Seite durch ein vollständiges zwei-Modi-System: Nutzer können entweder ihre analysierte Website verbessern lassen oder eine komplett neue Website von Scratch generieren — jeweils mit Live-Preview und ZIP-Export.

---

## Zwei Modi

### Modus 1: Bestehende Website verbessern
- Wird direkt nach einer Analyse über einen "Website verbessern" Button im `AnalysisDashboard` erreichbar
- Lädt automatisch alle Analyse-Daten (SEO-Issues, Design-Issues, Content-Issues, Brand DNA, Scores)
- KI generiert verbesserte Sections basierend auf den konkreten Problemen aus der Analyse
- Überspringt den Wizard — geht direkt zur Split-View

### Modus 2: Neue Website erstellen
- Über den normalen `/codegen` Einstieg erreichbar
- Kurzer Wizard mit 4 Pflichtfeldern:
  - **Business-Name** — wird in alle Sections eingebaut
  - **Branche** — bestimmt Ton, Stil und branchenspezifische Inhalte (nutzt bestehende `Industry` TypeScript-Type)
  - **Design-Stil** — Auswahl: Modern/Minimal, Luxus/Premium, Verspielt/Bunt, Corporate
  - **Kurzbeschreibung** — 1-2 Sätze über das Unternehmen und die Zielgruppe
- Nach dem Wizard → Split-View

---

## Layout: Split-View (Hauptansicht)

### Linke Seite — Konfiguration (240px fest)
- **Modus-Toggle** oben: "Verbessern" ↔ "Neu erstellen"
- **Kontext-Badge**: bei Verbessern: Analyse-Scores anzeigen; bei Neu: eingegebene Infos
- **Sections-Auswahl**: Checkboxen für Hero, Navigation, Services, CTA, Testimonials, Preise, Kontakt, Footer
- **↺ Regenerieren** Button neben jeder bereits generierten Section
- **Framework-Auswahl**: HTML/CSS oder Next.js
- **"Alle generieren" Button** — generiert alle ausgewählten Sections parallel via Promise.all

### Rechte Seite — Live-Preview
- **Browser-Mockup Header** mit Traffic-Lights und URL-Bar
- **iframe** das den generierten HTML-Code direkt rendert (srcDoc)
- **Loading-State** mit Spinner während Generierung
- **ZIP-Export Button** in der Header-Leiste — lädt vollständige HTML-Datei herunter

---

## Technische Architektur

### Frontend
- **Route**: bestehende `/app/(app)/codegen/page.tsx` wird komplett ersetzt
- **Wizard-State**: `step: 'mode' | 'configure' | 'builder'`
- **Builder-State**: 
  - `sections: Record<SectionId, { selected: boolean, code: string, loading: boolean }>`
  - `previewHtml: string` — zusammengesetztes HTML aller generierten Sections
- **Live-Preview**: `<iframe srcDoc={previewHtml} />` — kein separater Server nötig
- **ZIP-Export**: `Blob` mit `text/html` MIME-Type, Download via `<a>` Tag

### Backend
- **Bestehende `/api/codegen` Route erweitern**:
  - Neues optionales Feld: `analysisContext` (Issues + Scores aus der Analyse)
  - Neues optionales Feld: `newSiteContext` (Name, Branche, Stil, Beschreibung)
  - Beide Felder fließen in den Claude-Prompt ein
- **Parallele Generierung**: Frontend feuert alle Section-Requests gleichzeitig via `Promise.all`

### Navigation
- **AnalysisDashboard**: neuer Button "Website verbessern" neben "Content generieren"
  - Speichert `{ mode: 'improve', analysis }` in `sessionStorage`
  - Navigiert zu `/codegen`

---

## Code-Qualität — Premium Skills

Der generierte Code soll **nicht** generisch sein. Er nutzt dieselben Skills und Libraries die auch in der SiteIQ App selbst eingesetzt werden:

### Libraries im generierten Output (via CDN im ZIP)
- **GSAP + ScrollTrigger** — Scroll-Animationen, Parallax, reveal-on-scroll
- **Framer Motion** (bei Next.js Framework) — Page transitions, Micro-interactions
- **Tailwind CSS** — Utility-first Styling (via CDN Play)
- **Inter / custom Google Fonts** — Professionelle Typographie

### Design-Standards
- **Dark Mode First**: Deep Black `#0A0A0A` Hintergrund, Gold/Amber `#F59E0B` Akzente
- **Keine generischen AI-Aesthetics** — Kein Gradient-Soup, keine Stock-AI-Bilder
- **Bold Typography**: Große Headlines, starke visuelle Hierarchie
- **Micro-interactions**: Hover-States, Button-Animationen, smooth scrolling
- **Premium Sections**: Jede Section muss Awwwards-Niveau anstreben

### Claude-System-Prompt Ergänzung
```
Du bist ein Expert-Frontend-Entwickler auf Awwwards-Niveau.
Nutze GSAP für scroll-triggered Animationen (via CDN).
Verwende mutige Typographie, starke visuelle Hierarchie.
Kein generisches Design — jede Section muss distinctive sein.
Dark Mode: #0A0A0A Background, #F59E0B Akzente.
Inline alle Styles wo nötig für iframe-Kompatibilität.
```

---

## Prompt-Strategie

### Verbessern-Modus
```
Erstelle eine verbesserte [SECTION] für diese Website auf Awwwards-Niveau.

Analyse-Ergebnisse (diese Probleme gezielt fixen):
- SEO Score: 42/100 — Probleme: [issues]
- Design Score: 58/100 — Probleme: [issues]
- Content Score: 51/100 — Probleme: [issues]

Brand DNA: [tone, usp, targetAudience, colorPalette]

Tech: GSAP ScrollTrigger via CDN, Tailwind via CDN Play.
Dark Mode (#0A0A0A + #F59E0B), mobile-first, konversionsoptimiert.
Bold, distinctive Design. Keine generischen AI-Aesthetics.
```

### Neu-erstellen-Modus
```
Erstelle eine [SECTION] für folgendes Unternehmen auf Awwwards-Niveau.

Name: [name]
Branche: [industry]
Stil: [style]
Beschreibung: [description]

Tech: GSAP ScrollTrigger via CDN, Tailwind via CDN Play.
Dark Mode (#0A0A0A + #F59E0B), mobile-first, konversionsoptimiert.
Bold Typography, Micro-interactions, Premium Feel.
```

---

## ZIP-Export Format

Eine einzelne `index.html` Datei die alle generierten Sections enthält:
- `<head>` mit:
  - Tailwind CDN (Play)
  - GSAP + ScrollTrigger CDN
  - Google Fonts (Inter)
  - Meta-Tags, Viewport, Open Graph
- Alle Sections in richtiger Reihenfolge: Nav → Hero → Services → Testimonials → CTA → Preise → Kontakt → Footer
- GSAP-Initialisierung am Ende des `<body>` für alle Scroll-Animationen

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `app/(app)/codegen/page.tsx` | Komplett neu — Wizard + Split-View |
| `app/api/codegen/route.ts` | Erweitern um `analysisContext` + `newSiteContext` |
| `components/analysis/AnalysisDashboard.tsx` | Button "Website verbessern" hinzufügen |

---

## Was NICHT gebaut wird (YAGNI)
- Kein Drag & Drop Editor
- Kein Deploy auf Subdomain
- Keine Versionierung / History der generierten Sites
- Kein separater Dev-Server für Preview
- Keine Datenbank-Persistenz der generierten Sites
