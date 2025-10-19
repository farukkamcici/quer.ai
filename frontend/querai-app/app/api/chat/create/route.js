import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, data_source_id } = await request.json().catch(() => ({}))

  // Try backend first (if configured)
  const backendUrl = process.env.PYTHON_BACKEND_URL
    ? `${process.env.PYTHON_BACKEND_URL}/api/chat/create`
    : null

  if (backendUrl) {
    try {
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, title: title || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.chat_id) {
        // If a data_source_id is provided, update the chat record to bind it
        if (data_source_id) {
          await supabase
            .from('chats')
            .update({ data_source_id })
            .eq('id', data.chat_id)
            .eq('user_id', user.id)
        }
        return NextResponse.json({ chat_id: data.chat_id, source: 'backend' })
      }
      console.error('Backend chat create failed', { status: res.status, body: data })
      // fall through to direct insert
    } catch (_) {
      console.error('Backend chat create request errored; falling back')
      // fall back below
    }
  }

  // Fallback: insert directly via Supabase with RLS (user session)
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: user.id, title: title || null, data_source_id: data_source_id || null, messages: [] })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase direct insert failed', error)
    return NextResponse.json({ error: 'Direct insert failed', detail: error.message }, { status: 500 })
  }
  return NextResponse.json({ chat_id: data.id, source: 'supabase' })
}
