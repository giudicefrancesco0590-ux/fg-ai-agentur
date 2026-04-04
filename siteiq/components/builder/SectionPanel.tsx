// components/builder/SectionPanel.tsx
'use client'
import { RefreshCw, Check } from 'lucide-react'
import { SECTION_ORDER, SECTION_LABELS, type SectionId, type BuilderSections } from '@/lib/builder-utils'

interface SectionPanelProps {
  sections: BuilderSections
  onToggle: (id: SectionId) => void
  onRegenerate: (id: SectionId) => void
  chatbotEnabled: boolean
  chatbotLoading: boolean
  onChatbotToggle: () => void
}

export function SectionPanel({ sections, onToggle, onRegenerate, chatbotEnabled, chatbotLoading, onChatbotToggle }: SectionPanelProps) {
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

      {/* Chatbot Toggle */}
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
    </div>
  )
}
