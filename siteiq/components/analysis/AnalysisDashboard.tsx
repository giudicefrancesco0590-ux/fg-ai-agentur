'use client'
import { motion } from 'framer-motion'
import { ScoreRing } from './ScoreRing'
import { ModuleCard } from './ModuleCard'
import { ActionPlan } from './ActionPlan'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Analysis } from '@/types'
import { Search, Palette, FileText, Cpu } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AnalysisDashboard({ analysis }: { analysis: Analysis }) {
  const router = useRouter()

  const modules = [
    { title: 'SEO', data: analysis.seo, icon: <Search size={16} /> },
    { title: 'Design & UX', data: analysis.design, icon: <Palette size={16} /> },
    { title: 'Inhalt', data: analysis.content, icon: <FileText size={16} /> },
    { title: 'Technik', data: analysis.tech, icon: <Cpu size={16} /> },
  ]

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <p className="text-white/40 text-sm mb-1 truncate">{analysis.url}</p>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Analyse-Ergebnis</h1>
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
        </div>
      </motion.div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-violet rounded-2xl p-6 mb-6 flex items-center gap-8 shadow-[0_4px_40px_rgba(139,92,246,0.12)]"
      >
        <ScoreRing score={analysis.overallScore} size={140} label="Gesamt-Score" />
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <h2 className="text-4xl font-bold text-white">{analysis.overallScore}</h2>
            <span className="text-white/40">/100</span>
          </div>
          <p className="text-white/50 text-sm">
            Branche: <span className="text-violet-400 capitalize">{analysis.industry}</span>
          </p>
          {analysis.brandDna?.usp && (
            <p className="text-white/50 text-sm mt-1">
              USP: <span className="text-white/80">{analysis.brandDna.usp}</span>
            </p>
          )}
          {analysis.brandDna?.targetAudience && (
            <p className="text-white/50 text-sm mt-1">
              Zielgruppe: <span className="text-white/70">{analysis.brandDna.targetAudience}</span>
            </p>
          )}
        </div>

        {/* Brand DNA quick view */}
        {analysis.brandDna && (
          <Card className="hidden lg:block min-w-48">
            <p className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Brand DNA</p>
            <p className="text-sm text-white/80 mb-1">Ton: <span className="text-violet-400">{analysis.brandDna.tone}</span></p>
            <div className="flex flex-wrap gap-1 mt-2">
              {analysis.brandDna.values?.slice(0, 3).map((v, i) => (
                <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{v}</span>
              ))}
            </div>
          </Card>
        )}
      </motion.div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {modules.map(({ title, data, icon }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <ModuleCard
              title={title}
              score={data?.score ?? 0}
              issues={data?.issues ?? []}
              recommendations={data?.recommendations ?? []}
              icon={icon}
            />
          </motion.div>
        ))}
      </div>

      {/* Competitors */}
      {analysis.competitors?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-6">
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Wettbewerber</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.competitors.map((comp, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5">
                  <p className="font-medium text-white">{comp.name}</p>
                  <p className="text-xs text-white/40 mb-2">{comp.url}</p>
                  <div className="flex flex-wrap gap-1">
                    {comp.contentGaps?.slice(0, 2).map((gap, j) => (
                      <span key={j} className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{gap}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Action Plan */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <ActionPlan items={analysis.actionPlan ?? []} />
      </motion.div>
    </div>
  )
}
