import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#080808] relative overflow-hidden">
      {/* Background glow blobs — give glass panels something to refract */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[600px] bg-violet-700/6 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-violet-900/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-800/3 rounded-full blur-[140px] pointer-events-none z-0" />
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto relative z-10">
        {children}
      </main>
    </div>
  )
}
