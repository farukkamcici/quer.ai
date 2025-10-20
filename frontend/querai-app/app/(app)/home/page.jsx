import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import ChatSidebar from '@/components/layout/ChatSidebar'
import ChatInterface from '@/components/chat/ChatInterface'
import UserProfile from '@/components/auth/UserProfile'
import ThemeToggle from '@/components/brand/ThemeToggle'
import { Surface } from '@/components/brand/Surface'

// App home relocated under the (app) route group so the marketing page can live at '/'
export default async function AppHomePage() {
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
      .select('id,name,source_type,db_details,user_id,created_at,schema_json')
      .order('created_at', { ascending: false })
    const { data, error } = await query.eq('user_id', user.id)
    if (error) throw error
    connections = data || []
  } catch (e) {
    // Fallback without filter if schema differs
    const { data } = await supabase
      .from('connections')
      .select('id,name,source_type,db_details,created_at,schema_json')
      .order('created_at', { ascending: false })
    connections = data || []
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar />
      <main className="flex-1 flex flex-col overflow-hidden items-center bg-gradient-to-b from-sky-50 to-white dark:from-[#0b1220] dark:to-[#0a0f1c]">
        <header className="sticky top-0 z-20 w-full px-4 pt-8 pb-4 bg-transparent">
          <div className="mx-auto w-full max-w-7xl">
            <Surface variant="glass" className="relative rounded-3xl px-6 py-4">
              <div className="relative flex items-center justify-between">
                {/* Link the brand to the marketing homepage */}
                <Link href="/" className="text-left text-lg font-semibold tracking-wide text-sky-900/80 hover:text-sky-900 dark:text-sky-100/90">
                  Querai
                </Link>
                <div className="flex items-center gap-3">
                  <ThemeToggle inline />
                  <UserProfile user={user} />
                </div>
              </div>
            </Surface>
          </div>
        </header>
        <ChatInterface />
      </main>
      <Sidebar connections={connections} user={user} />
    </div>
  )
}
