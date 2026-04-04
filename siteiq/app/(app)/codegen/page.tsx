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
    background: #8B5CF6; border: none; cursor: pointer;
    box-shadow: 0 4px 24px rgba(139,92,246,0.4);
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
  .siteiq-msg.user { background: #8B5CF6; color: #000; align-self: flex-end; font-weight: 500; }
  #siteiq-chat-input-row {
    padding: 12px; border-top: 1px solid #222; display: flex; gap: 8px;
  }
  #siteiq-chat-input {
    flex: 1; background: #222; border: 1px solid #333; border-radius: 8px;
    padding: 8px 12px; color: #fff; font-size: 13px; outline: none;
  }
  #siteiq-chat-send {
    background: #8B5CF6; color: #000; border: none; border-radius: 8px;
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
    const analysisHost = analysis?.url
      ? (() => { try { return new URL(analysis.url.startsWith('http') ? analysis.url : `https://${analysis.url}`).hostname } catch { return analysis.url } })()
      : null

    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center px-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-400/80 mb-5 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            KI Website Builder
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-4 leading-tight">
            Deine Website.<br />
            <span className="text-violet-400">Perfektioniert.</span>
          </h1>
          <p className="text-white/35 text-base max-w-sm mx-auto leading-relaxed">
            Komplette Website in 30 Sekunden — mit GSAP-Animationen, Live-Preview und KI-Chatbot
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xl">

          {/* Verbessern */}
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            whileHover={{ y: analysis ? -3 : 0 }}
            whileTap={{ scale: analysis ? 0.98 : 1 }}
            onClick={() => {
              if (!analysis) { router.push('/'); return }
              setMode('improve'); setStep('builder')
            }}
            className={`group relative overflow-hidden p-6 border rounded-2xl text-left transition-all duration-300 ${
              analysis
                ? 'bg-white/[0.03] border-white/10 hover:border-violet-500/40 hover:bg-violet-500/[0.04]'
                : 'bg-white/[0.02] border-white/5 opacity-40 cursor-default'
            }`}
          >
            {/* Subtle top border glow on hover */}
            {analysis && (
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20">
                <Globe size={16} className="text-violet-400" />
              </div>
              {analysis && (
                <div className="flex gap-1">
                  <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/35 font-mono">
                    {analysis.seo?.score}
                  </span>
                  <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/35 font-mono">
                    {analysis.design?.score}
                  </span>
                  <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/35 font-mono">
                    {analysis.content?.score}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">01</p>
              <h3 className="text-white font-semibold text-sm">Bestehende verbessern</h3>
            </div>
            <p className="text-white/35 text-xs leading-relaxed mt-2">
              {analysis
                ? `${analysisHost} — KI behebt alle Schwachstellen aus der Analyse`
                : 'Website zuerst analysieren'}
            </p>

            {analysis && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/25 uppercase tracking-wider">Analyse geladen</span>
                <span className="text-violet-400 text-xs group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            )}
          </motion.button>

          {/* Neu erstellen */}
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode('new'); setStep('configure') }}
            className="group relative overflow-hidden p-6 bg-white/[0.03] border border-white/10 rounded-2xl text-left hover:border-violet-500/40 hover:bg-violet-500/[0.04] transition-all duration-300"
          >
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="w-9 h-9 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 mb-4">
              <Wand2 size={16} className="text-violet-400" />
            </div>

            <div className="mb-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">02</p>
              <h3 className="text-white font-semibold text-sm">Neue Website erstellen</h3>
            </div>
            <p className="text-white/35 text-xs leading-relaxed mt-2">
              Name, Branche, Stil — KI generiert Hero, Nav, Services, CTA, Footer
            </p>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-white/25 uppercase tracking-wider">Von Scratch</span>
              <span className="text-violet-400 text-xs group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </motion.button>
        </div>

        {/* Capabilities */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-5 mt-10"
        >
          {['GSAP Animationen', 'Live-Preview', 'Mobil-Ansicht', 'ZIP-Export', 'KI-Chatbot'].map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11px] text-white/20 tracking-wide">
              <span className="w-0.5 h-0.5 bg-violet-500/40 rounded-full" />
              {f}
            </span>
          ))}
        </motion.div>

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
            Website <span className="text-violet-400">Builder</span>
          </h1>
          {mode === 'improve' && analysis && (
            <span className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2.5 py-1 rounded-full">
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
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
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
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs font-medium text-violet-400 mb-1">Analyse geladen</p>
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
            className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
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
