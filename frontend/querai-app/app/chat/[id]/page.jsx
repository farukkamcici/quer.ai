import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatPageClient from '@/components/chat/ChatPageClient'

export default async function ChatPage({ params }) {
  const supabase = createClient()
  const { id } = params

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: chat } = await supabase
    .from('chats')
    .select('id,title,data_source_id,messages')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!chat) redirect('/')

  const { data: connections } = await supabase
    .from('connections')
    .select('id,name,source_type,db_details,s3_uri')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-full w-full justify-center">
      <ChatPageClient chat={chat} connections={connections || []} />
    </div>
  )
}

