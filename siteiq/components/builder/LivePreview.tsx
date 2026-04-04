// components/builder/LivePreview.tsx
'use client'
import { Download, Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { downloadHtml } from '@/lib/builder-utils'

interface LivePreviewProps {
  html: string
  hasContent: boolean
  isGenerating: boolean
}

export function LivePreview({ html, hasContent, isGenerating }: LivePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="flex-1 flex flex-col bg-[#0D0D0D] border border-white/8 rounded-2xl overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#111]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="bg-white/5 rounded px-3 py-1 text-xs text-white/30 min-w-40">
            preview
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewport(v => v === 'desktop' ? 'mobile' : 'desktop')}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            title="Viewport wechseln"
          >
            {viewport === 'desktop' ? <Smartphone size={14} /> : <Monitor size={14} />}
          </button>
          {hasContent && (
            <button
              onClick={() => downloadHtml(html)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
            >
              <Download size={13} />
              ZIP
            </button>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Leerer State */}
        {!hasContent && !isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
            <Monitor size={40} />
            <p className="text-sm">Live-Vorschau erscheint hier</p>
          </div>
        )}
        {/* Generating-Indicator (non-blocking — oben rechts) */}
        {isGenerating && hasContent && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-amber-500/20 rounded-full px-3 py-1.5">
            <div className="w-3 h-3 border border-amber-500/50 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-xs text-amber-400">generiert...</span>
          </div>
        )}
        {/* Initial loading — nur wenn noch gar nichts da ist */}
        {isGenerating && !hasContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0D0D0D]">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-sm text-white/30">KI generiert deine Website...</p>
          </div>
        )}
        <div className={`h-full flex justify-center transition-all duration-300 ${viewport === 'mobile' ? 'bg-[#1a1a1a] p-4' : ''}`}>
          <iframe
            srcDoc={html || '<html><body style="background:#0a0a0a"></body></html>'}
            className={`border-0 transition-all duration-300 ${
              viewport === 'mobile'
                ? 'w-[390px] rounded-xl shadow-2xl border border-white/10'
                : 'w-full h-full'
            }`}
            style={{ height: viewport === 'mobile' ? '100%' : undefined }}
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
