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
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40"
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
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
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
                  ? 'bg-violet-500/20 border border-violet-500/30'
                  : 'bg-white/3 border border-white/5 hover:border-white/10'
              }`}
            >
              <div className={`text-sm font-medium mb-0.5 ${config.style === s.value ? 'text-violet-400' : 'text-white/70'}`}>
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
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 resize-none"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!isValid}
        className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
      >
        Website generieren →
      </button>
    </motion.div>
  )
}
