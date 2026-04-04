'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { Search, FileText, Bot, Zap, Globe } from 'lucide-react'

const STEPS = [
  { key: 'scraping', label: 'Website laden' },
  { key: 'detecting', label: 'Branche erkennen' },
  { key: 'seo', label: 'SEO-Agent' },
  { key: 'design', label: 'Design-Agent' },
  { key: 'content', label: 'Content-Agent' },
  { key: 'tech', label: 'Tech-Agent' },
  { key: 'competitors', label: 'Wettbewerb' },
  { key: 'scoring', label: 'Score berechnen' },
]

const FEATURES = [
  { icon: Search, label: 'Website-Analyse', desc: 'SEO, Design, Content, Tech in 30s' },
  { icon: Globe, label: 'Website Builder', desc: 'KI erstellt komplette Website' },
  { icon: FileText, label: 'Content Factory', desc: 'Ads, Posts, E-Mails auf Knopfdruck' },
  { icon: Bot, label: 'KI-Chatbot', desc: 'Einbettbarer Assistent für deine Site' },
]

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ step: string; message: string; percent: number } | null>(null)
  const router = useRouter()

  async function handleAnalyze(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!url) return
    setLoading(true)
    setError('')
    setProgress(null)

    try {
      const res = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) throw new Error('Analyse fehlgeschlagen')
      if (!res.body) throw new Error('Kein Stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        let event = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (event === 'progress') {
              setProgress(data)
            } else if (event === 'done') {
              sessionStorage.setItem('latest-analysis', JSON.stringify(data))
              router.push('/dashboard')
              return
            } else if (event === 'error') {
              throw new Error(data.message)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen. Bitte URL prüfen.')
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-[#080808]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-800/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl text-center relative z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 text-xs text-violet-300 mb-8 tracking-wide"
        >
          <Zap size={11} className="text-violet-400" />
          KI Business Operating System
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-5xl md:text-6xl font-bold mb-5 tracking-tight leading-[1.1]"
        >
          Eine URL.
          <br />
          <span className="text-violet-400">Alles automatisiert.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-white/40 text-lg mb-10 max-w-lg mx-auto leading-relaxed"
        >
          Analyse, Website-Erstellung, Content, Chatbot —
          SiteIQ ersetzt dein komplettes Digital-Team.
        </motion.p>

        {/* Input */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleAnalyze}
          className="flex gap-3"
        >
          <Input
            type="url"
            placeholder="https://deine-website.de"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="flex-1 text-base py-3"
            error={error}
            disabled={loading}
          />
          <Button type="submit" size="lg" disabled={loading || !url}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Analysiere...
              </span>
            ) : 'Analysieren →'}
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 mt-5 justify-center text-sm text-white/30"
        >
          <div className="h-px bg-white/8 flex-1" />
          <VoiceButton onTranscript={setUrl} />
          <span>oder per Sprache</span>
          <div className="h-px bg-white/8 flex-1" />
        </motion.div>

        {/* Progress */}
        <AnimatePresence>
          {loading && progress && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 glass rounded-2xl p-6 shadow-[0_4px_32px_rgba(0,0,0,0.3)]"
            >
              <div className="w-full bg-white/5 rounded-full h-0.5 mb-5">
                <motion.div
                  className="bg-violet-500 h-0.5 rounded-full"
                  animate={{ width: `${progress.percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-violet-400 font-medium mb-4 text-sm">{progress.message}</p>
              <div className="grid grid-cols-4 gap-2">
                {STEPS.map((step) => {
                  const currentIdx = STEPS.findIndex(s => s.key === progress.step)
                  const stepIdx = STEPS.indexOf(step)
                  const isDone = stepIdx < currentIdx
                  const isActive = step.key === progress.step
                  return (
                    <div
                      key={step.key}
                      className={`text-xs px-2 py-1.5 rounded-lg text-center transition-all ${
                        isActive
                          ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                          : isDone
                          ? 'bg-white/5 text-white/50'
                          : 'text-white/20'
                      }`}
                    >
                      {isDone && <span className="mr-1">✓</span>}
                      {isActive && <span className="mr-1 inline-block animate-pulse">●</span>}
                      {step.label}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Pills */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-4 gap-3 mt-12"
          >
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="glass rounded-xl p-3 text-left hover:border-violet-500/25 hover:bg-white/[0.06] transition-all duration-200 group shadow-[0_2px_16px_rgba(0,0,0,0.2)]"
              >
                <div className="w-7 h-7 bg-violet-500/10 rounded-lg flex items-center justify-center mb-2.5 group-hover:bg-violet-500/15 transition-colors">
                  <Icon size={13} className="text-violet-400" />
                </div>
                <p className="text-white/80 text-xs font-medium mb-0.5">{label}</p>
                <p className="text-white/30 text-[10px] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Stats */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-12 mt-10"
          >
            {[
              { value: '30s', label: 'Analyse' },
              { value: '8+', label: 'KI-Agenten' },
              { value: '100%', label: 'Automatisiert' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-violet-400">{value}</p>
                <p className="text-xs text-white/30 mt-0.5 tracking-wide uppercase">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-white/15 mt-10"
        >
          <a href="/login" className="hover:text-white/35 transition-colors">Anmelden</a>
          {' · '}
          <a href="/register" className="hover:text-white/35 transition-colors">Registrieren</a>
        </motion.p>
      </motion.div>
    </main>
  )
}
