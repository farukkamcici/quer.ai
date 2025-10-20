import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = createClient();

  // 1. Check if the user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get the question and connection ID from the request body
  const { question, connection_id } = await req.json();
  if (!question || !connection_id) {
    return NextResponse.json({ error: 'Missing question or connection_id' }, { status: 400 });
  }

  try {
    // 3. Forward the minimal request to the Python backend; backend uses cached schema
    const backendUrl = `${process.env.PYTHON_BACKEND_URL}/api/query`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        connection_id,
        user_id: user.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Upstream request failed');
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.', detail: error.message }, { status: 500 });
  }
}
