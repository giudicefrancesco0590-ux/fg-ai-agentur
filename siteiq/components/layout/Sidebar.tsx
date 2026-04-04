'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Sparkles, FolderOpen, Settings, LogOut,
  Bot, Target, Mic, Video, Code2, PhoneCall,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/content', label: 'Content Factory', icon: Sparkles },
  { href: '/chatbot', label: 'KI-Chatbot Builder', icon: Bot },
  { href: '/leads', label: 'Lead-Generierung', icon: Target },
  { href: '/voice', label: 'Voice Assistant', icon: Mic },
  { href: '/voice-agent', label: 'Voice Agent Builder', icon: PhoneCall },
  { href: '/video', label: 'Video-Analyse', icon: Video },
  { href: '/codegen', label: 'Website Builder', icon: Code2 },
  { href: '/crm', label: 'CRM', icon: FolderOpen },
  { href: '/settings', label: 'Einstellungen', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass-strong border-r border-white/[0.06] flex flex-col z-50 shadow-[4px_0_32px_rgba(0,0,0,0.4)]">
      <div className="p-6 border-b border-white/[0.06]">
        <Link href="/">
          <span className="text-xl font-bold text-white">Site<span className="text-violet-400">IQ</span></span>
          <p className="text-xs text-white/30 mt-0.5">AI Business OS</p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
              pathname === href
                ? 'glass-violet text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/[0.06] space-y-2">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5">
          + Neue Analyse
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-red-400 transition-colors w-full rounded-lg hover:bg-white/5"
        >
          <LogOut size={12} />
          Abmelden
        </button>
      </div>
    </aside>
  )
}
