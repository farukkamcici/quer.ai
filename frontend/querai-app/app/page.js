import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UserProfile from '@/components/auth/UserProfile'
import Sidebar from '@/components/layout/Sidebar'
import ChatInterface from '@/components/chat/ChatInterface'

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
      <Sidebar connections={connections} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 flex justify-end p-4 border-b">
          <UserProfile user={user} />
        </header>
        <ChatInterface />
      </main>
    </div>
  )
}
