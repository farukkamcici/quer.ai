"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useConnectionStore } from "@/lib/stores/connectionStore";
import ChatInterface from "@/components/chat/ChatInterface";
import { createClient } from "@/lib/supabase/client";

export default function ChatPageClient({ chat, connections }) {
  const supabase = useMemo(() => createClient(), []);
  const { selectedConnection, setSelectedConnection } = useConnectionStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (chat?.data_source_id) {
      const found = connections.find((c) => c.id === chat.data_source_id);
      if (found) setSelectedConnection(found);
    }
  }, [chat?.data_source_id, connections, setSelectedConnection]);

  async function onSelectChange(e) {
    const id = e.target.value || null;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('chats')
        .update({ data_source_id: id })
        .eq('id', chat.id);
      if (!error) {
        const found = connections.find((c) => c.id === id);
        if (found) setSelectedConnection(found);
      }
    } finally {
      setSaving(false);
    }
  }

  const needsSource = !selectedConnection;

  return (
    <div className="flex w-full max-w-4xl flex-col p-4 gap-4">
      {needsSource && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Please select a data source before chatting.
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          defaultValue={chat.data_source_id || ""}
          onChange={onSelectChange}
          className="w-full rounded-md border border-neutral-200 bg-white p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <option value="">Select Data Source…</option>
          {connections.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.source_type})</option>
          ))}
        </select>
        {saving && <span className="text-xs text-neutral-500">Saving…</span>}
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatInterface chatId={chat.id} initialMessages={chat.messages || []} />
      </div>
    </div>
  );
}
