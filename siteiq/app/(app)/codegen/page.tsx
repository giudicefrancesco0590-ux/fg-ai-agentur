// app/(app)/codegen/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
  const router = useRouter()
  const [step, setStep] = useState<Step>('select-mode')
  const [mode, setMode] = useState<Mode>('new')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [config, setConfig] = useState<NewSiteConfig>(DEFAULT_CONFIG)
  const [sections, setSections] = useState<BuilderSections>(createInitialSections())
  const [framework, setFramework] = useState<'html' | 'nextjs'>('html')
  const [previewHtml, setPreviewHtml] = useState('')
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [chatbotEnabled, setChatbotEnabled] = useState(false)
  const [chatbotScript, setChatbotScript] = useState('')
  const [chatbotLoading, setChatbotLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('latest-analysis')
    if (stored) {
      try {
        setAnalysis(JSON.parse(stored))
      } catch { /* ignore */ }
    }
    const builderMode = sessionStorage.getItem('builder-mode')
    if (builderMode === 'improve') {
      sessionStorage.removeItem('builder-mode')
      setMode('improve')
      setStep('builder')
    }
  }, [])

  useEffect(() => {
    const html = assembleHtml(
      sections,
      config.businessName || analysis?.url || 'Mein Unternehmen',
      chatbotEnabled ? chatbotScript : undefined
    )
    setPreviewHtml(html)
  }, [sections, config.businessName, analysis?.url, chatbotScript, chatbotEnabled])

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

  const generateChatbot = useCallback(async () => {
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
      const script = `
<!-- KI-Chatbot by SiteIQ -->
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
    <button id="siteiq-chat-send" onclick="(function(){const input=document.getElementById('siteiq-chat-input');const msgs=document.getElementById('siteiq-chat-messages');if(!input.value.trim())return;const userMsg=document.createElement('div');userMsg.className='siteiq-msg user';userMsg.textContent=input.value;msgs.appendChild(userMsg);input.value='';msgs.scrollTop=msgs.scrollHeight;})()">→</button>
  </div>
</div>`
      setChatbotScript(script)
    } finally {
      setChatbotLoading(false)
    }
  }, [chatbotEnabled, mode, analysis, config])

  async function generateAll() {
    setIsGeneratingAll(true)
    const selected = Object.entries(sections)
      .filter(([, s]) => s.selected)
      .map(([id]) => id as SectionId)
    await Promise.all([
      ...selected.map(id => generateSection(id)),
      chatbotEnabled ? generateChatbot() : Promise.resolve(),
    ])
    setIsGeneratingAll(false)
  }

  function toggleSection(id: SectionId) {
    setSections(prev => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }))
  }

  const anyLoading = Object.values(sections).some(s => s.loading) || chatbotLoading
  const hasContent = Object.values(sections).some(s => s.code.length > 0)
  const selectedCount = Object.values(sections).filter(s => s.selected).length

  // ─── Mode Selection ──────────────────────────────────────────────────
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
          <motion.button
            whileHover={{ scale: analysis ? 1.02 : 1 }}
            whileTap={{ scale: analysis ? 0.98 : 1 }}
            onClick={() => {
              if (!analysis) { router.push('/'); return }
              setMode('improve'); setStep('builder')
            }}
            className={`group relative p-6 border rounded-2xl text-left transition-all ${
              analysis
                ? 'bg-white/3 border-white/8 hover:border-amber-500/30 hover:bg-amber-500/5 cursor-pointer'
                : 'bg-white/2 border-white/5 cursor-default opacity-60'
            }`}
          >
            {analysis && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-amber-400 rounded-full" />
            )}
            <Globe size={24} className="text-amber-400 mb-4" />
            <h3 className="text-white font-semibold mb-1">Bestehende verbessern</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              {analysis
                ? `Nutzt deine Analyse von ${analysis.url}`
                : 'Keine Analyse vorhanden — klicken zum Analysieren'}
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

  // ─── Wizard ──────────────────────────────────────────────────────────
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
        <div className="flex items-center gap-2">
          {framework === 'nextjs' && (
            <span className="text-xs text-white/30 border border-white/10 rounded-lg px-2 py-1">
              Kein Preview — Code-Export
            </span>
          )}
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
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="w-56 flex flex-col gap-4 shrink-0">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex-1 overflow-auto">
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
              chatbotEnabled={chatbotEnabled}
              chatbotLoading={chatbotLoading}
              onChatbotToggle={() => setChatbotEnabled(v => !v)}
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

        <LivePreview
          html={previewHtml}
          hasContent={hasContent}
          isGenerating={anyLoading}
        />
      </div>
    </div>
  )
}
