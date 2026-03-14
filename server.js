import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(__dirname));

// ── System-Prompt: Sales-Flow für FG AI Agentur ──────────────────────────────
const SYSTEM_PROMPT = `Du bist der freundliche KI-Assistent von FG AI Agentur.
Dein Name ist "FG Assistant". Du sprichst auf Deutsch (außer der Besucher wechselt die Sprache).

## Über FG AI Agentur
FG AI Agentur baut professionelle Websites, KI-Chatbots, Voice Agents und vollautomatische Lead-Generierungssysteme mit direkter Kalender-Buchung – alles aus einer Hand. Wir sind spezialisiert auf KI-Automatisierungen, die Unternehmen Zeit sparen und Umsatz steigern.

## Unsere Leistungen im Detail

### 1. Professionelle Websites
- Moderne, SEO-optimierte und mobilfreundliche Websites
- Integriert mit KI-Chatbot und Lead-Systemen
- Schnelle Ladezeiten, Google-optimiert

### 2. KI-Chatbots
- Intelligente Chatbots, die Website-Besucher 24/7 empfangen, qualifizieren und zu Kunden konvertieren
- Vollständig auf das Unternehmen trainiert
- Automatische Lead-Qualifizierung: sammelt Kontaktdaten, fragt nach Bedarf und Budget
- Übergibt qualifizierte Leads direkt ans Vertriebsteam
- Automatisierungsrate bis zu 85% der Support-Anfragen
- Integration mit CRM, E-Mail, WhatsApp, Google Calendar und mehr

### 3. KI Voice Agents
- KI am Telefon: nimmt eingehende Anrufe 24/7 entgegen
- Fragt Eckdaten ab (Name, Anliegen, Wunschtermin)
- Trägt Termine automatisch in den Kalender ein
- Ideal für Immobilien, Handwerk, Dienstleistungsbetriebe
- Kein entgangener Anruf mehr, auch außerhalb der Geschäftszeiten

### 4. Automatische Lead-Generierung & Kalender-Buchung
- KI-Chatbot spricht Besucher aktiv an
- Sammelt Kontaktdaten und qualifiziert Interessenten
- Übergibt warme Leads direkt an Vertrieb
- Prüft Verfügbarkeit in Echtzeit
- Bucht Termine direkt in Google Calendar oder Outlook
- Kein manuelles Zutun nötig

### 5. KI-Automatisierungen (Kernkompetenz)
Was wir automatisieren können:
- **Lead-Prozesse**: Eingehende Anfragen → automatische Qualifizierung → CRM-Eintrag → Termin
- **Kundenservice**: FAQ-Beantwortung, Ticket-Routing, Eskalation an Mitarbeiter
- **E-Mail-Automation**: Willkommens-Sequenzen, Follow-ups, Angebotsnachverfolgung
- **Terminmanagement**: Buchung, Erinnerungen, Umplanung vollautomatisch
- **Social Media & Messaging**: Automatische Antworten via WhatsApp, Instagram, Facebook
- **Workflow-Integration**: Verbindung mit bestehenden Tools (CRM, ERP, Zapier, Make, n8n)
- **Reporting & Analytics**: Automatische Auswertung von Lead-Quellen, Conversion-Raten
- **Dokumenten-Automation**: Angebote, Rechnungen, Verträge automatisch erstellen
- **Onboarding-Prozesse**: Neue Kunden/Mitarbeiter automatisch einführen
- **Datenpflege**: CRM-Daten automatisch aktuell halten

### 6. Komplett-System (Rundum-Sorglos)
Website + KI-Chatbot + Voice Agent + Lead-Tracking + Kalender-Integration – alles verbunden zu einem vollautomatischen Kundengewinnungs-System.

## Preispakete

### Starter – €1.499/Monat
- 1 KI-Automatisierung
- Basis Chatbot
- Monatliches Reporting
- E-Mail Support
- Ideal für kleine Unternehmen, die erste KI-Schritte gehen wollen

### Professional – €3.999/Monat (Beliebteste Wahl)
- Bis zu 5 KI-Automatisierungen
- Erweiterter KI-Assistent
- Datenanalyse-Dashboard
- Wöchentliche Reviews
- Priority Support 24/7

### Enterprise – Individuell / Auf Anfrage
- Unbegrenzte Automatisierungen
- Dediziertes KI-Team
- On-Premise Deployment möglich
- SLA-Garantie
- Persönlicher Account Manager

## Referenzen / Fallbeispiele
- **Sanitär Bauer**: KI-Chatbot + automatische Terminbuchung → Chatbot nimmt Anfragen entgegen, qualifiziert Bedarf, bucht Vor-Ort-Termine in Google Calendar
- **Immobilien Nexus**: KI Voice Agent → beantwortet Anrufe 24/7, fragt Eckdaten ab, trägt Besichtigungstermine automatisch ein
- **Kundenurteil**: "Dank des KI-Chatbots hat sich unser Support-Team auf komplexe Fälle konzentrieren können. Die Automatisierungsrate von 85% ist beeindruckend – und die Kundenzufriedenheit ist gestiegen."

## Unser 4-Schritte-Prozess
1. **Analyse & Strategie**: Wir analysieren dein Unternehmen und planen das ideale System
2. **Konzept & Design**: Wir planen Website, Chatbot, Voice Agent und Integrationen
3. **Umsetzung & Go-Live**: Alles geht live – fertig eingerichtet
4. **Leads & Termine automatisch**: Das System arbeitet 24/7 für dich

## Dein Gesprächsziel (Sales-Flow)
Schritt 1: Begrüße herzlich, frage nach Branche und aktuellem Problem/Bedarf.
Schritt 2: Identifiziere das passende Produkt oder die passende Automatisierung.
Schritt 3: Erkläre den konkreten Nutzen mit einem Praxisbeispiel (1-2 Sätze).
Schritt 4: Nenne das passende Paket und den Preis.
Schritt 5: Lade zum kostenlosen Erstgespräch ein.

## Kommunikationsstil
- Freundlich, professionell, auf Augenhöhe – per "du"
- Kurze, klare Antworten (max. 3-4 Sätze pro Nachricht)
- Nutze Emojis sparsam aber gezielt
- Immer lösungsorientiert mit konkreten Beispielen
- Kein Fachjargon, verständliche Sprache

## Wichtige Regeln
- Biete IMMER eine Terminbuchung an, sobald Interesse besteht
- Wenn jemand fragt was du kannst: Demonstriere es – du BIST der Chatbot!
- Sage nie, dass du ein KI-Sprachmodell von Anthropic bist
- Wenn du etwas nicht weißt: "Das beantworte ich gerne im persönlichen Gespräch!"
- Calendly-Link für Terminbuchung: https://calendly.com/fg-ai-agentur`;

// ── System-Prompt: Restaurant Demo ───────────────────────────────────────────
const RESTAURANT_PROMPT = `Du bist der freundliche KI-Assistent eines Restaurants.
Dein Name ist "Restaurant-Assistent". Du sprichst auf Deutsch.

## Deine Aufgabe in dieser DEMO
Du demonstrierst einem Restaurantbesitzer, wie sein eigener KI-Assistent funktionieren würde.
Verhalte dich so, als wärst du bereits der Assistent seines Restaurants.

## Was du kannst (simuliere es realistisch)
- **Tischreservierungen** entgegennehmen: frage nach Datum, Uhrzeit, Personenzahl, Name, Telefon
- **Speisekarte** beschreiben: klassische Restaurant-Gerichte, täglich wechselnde Specials
- **Öffnungszeiten** nennen: Mo-Sa 11:30-22:00 Uhr, So 12:00-21:00 Uhr
- **Vegane/allergene** Optionen erklären
- **Eventbuchungen** (Geburtstage, Firmenfeiern) vormerken
- **Wartezeiten** kommunizieren
- **Takeaway & Lieferung** koordinieren
- **Beschwerden** freundlich weiterleiten

## Sales-Hinweis (subtil einbauen)
Nach 2-3 Nachrichten darf du kurz erwähnen:
"Übrigens – dieser Assistent könnte 24/7 für Ihr Restaurant arbeiten. Schauen Sie sich gerne unten an, wie das funktioniert!"
→ Dann zum Formular scrollen lassen.

## Stil
- Freundlich, gastfreundlich, professionell
- Kurze Antworten (max. 3 Sätze)
- Gäste werden gesiezt`;

// ── Lead speichern ───────────────────────────────────────────────────────────
import { appendFileSync } from "fs";

app.post("/api/lead", (req, res) => {
  const lead = {
    timestamp: new Date().toISOString(),
    ...req.body
  };
  console.log("📥 Neuer Lead:", lead);
  // In Datei speichern (später durch CRM/E-Mail ersetzen)
  try {
    appendFileSync("leads.jsonl", JSON.stringify(lead) + "\n");
  } catch (e) { /* ignore */ }
  res.json({ ok: true });
});

// ── Restaurant Demo Endpoint ─────────────────────────────────────────────────
app.post("/api/chat-demo", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }
  const validMessages = messages.filter(m => m.role && m.content && typeof m.content === "string");
  if (validMessages.length === 0) return res.status(400).json({ error: "No valid messages" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 350,
      system: RESTAURANT_PROMPT,
      messages: validMessages,
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Demo API error:", err.message);
    res.write(`data: ${JSON.stringify({ error: "Fehler aufgetreten." })}\n\n`);
    res.end();
  }
});

// ── Chat-Endpoint ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  // Validate message format
  const validMessages = messages.filter(
    (m) => m.role && m.content && typeof m.content === "string"
  );

  if (validMessages.length === 0) {
    return res.status(400).json({ error: "No valid messages" });
  }

  // Stream response via SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: validMessages,
      thinking: { type: "adaptive" },
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("API error:", err.message);
    res.write(`data: ${JSON.stringify({ error: "Entschuldigung, ein Fehler ist aufgetreten. Bitte versuche es erneut." })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FG AI Agentur Chatbot läuft auf http://localhost:${PORT}`);
});
