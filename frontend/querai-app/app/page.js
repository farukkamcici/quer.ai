import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import ChatInterface from '@/components/chat/ChatInterface'
import UserProfile from '@/components/auth/UserProfile'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch connections on the server and pass to client component
  let connections = []
  try {
    const query = supabase
      .from('connections')
      .select('id,name,source_type,db_details,user_id,created_at')
      .order('created_at', { ascending: false })
    const { data, error } = await query.eq('user_id', user.id)
    if (error) throw error
    connections = data || []
  } catch (e) {
    // Fallback without filter if schema differs
    const { data } = await supabase
      .from('connections')
      .select('id,name,source_type,db_details,created_at')
      .order('created_at', { ascending: false })
    connections = data || []
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar connections={connections} user={user} />
      <main className="flex-1 flex flex-col overflow-hidden items-center bg-gradient-to-b from-sky-50 to-white dark:from-[#0b1220] dark:to-[#0a0f1c]">
        <header className="sticky top-0 z-20 w-full px-4 pt-8 pb-4 bg-transparent">
          <div className="mx-auto w-full max-w-7xl">
            <div className="relative rounded-3xl border border-white/25 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-200 shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-6 py-4">
              {/* Glass inner glow/highlight overlays */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/70 via-white/20 to-transparent opacity-70" />
              <div className="pointer-events-none absolute inset-px rounded-2xl ring-1 ring-white/50 dark:ring-white/10" />
              <div className="relative flex items-center justify-between">
                <h1 className="text-left text-lg font-semibold tracking-wide text-sky-900/80 dark:text-sky-100/90">Querai</h1>
                <UserProfile user={user} />
              </div>
            </div>
          </div>
        </header>
        <ChatInterface />
      </main>
    </div>
  )
}
