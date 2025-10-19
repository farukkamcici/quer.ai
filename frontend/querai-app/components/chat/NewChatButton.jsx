"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/lib/stores/chatStore";
import { useConnectionStore } from "@/lib/stores/connectionStore";

export default function NewChatButton({ compact = false }) {
  const [loading, setLoading] = useState(false);
  const { currentDataSourceId, setChatId, resetChat } = useChatStore();
  const { selectedConnection } = useConnectionStore();

  const createNewChat = async () => {
    setLoading(true);
    try {
      const dataSourceId = currentDataSourceId || selectedConnection?.id || null;
      if (!dataSourceId) {
        toast.error("Please select a data source before starting a new chat.");
        return;
      }

      const res = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_source_id: dataSourceId }),
      });
      const data = await res.json();
      if (res.ok && data?.chat_id) {
        resetChat();
        setChatId(data.chat_id);
        toast.success("New chat started!");
      } else {
        console.error("Failed to create chat", { status: res.status, data });
        toast.error(data?.error || "Failed to create chat", {
          description: data?.detail || (typeof data === 'string' ? data : undefined),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={createNewChat}
        disabled={loading}
        title="New Chat"
        className="inline-flex size-8 items-center justify-center rounded-md border border-[var(--qr-border)] bg-[var(--qr-surface)] text-[var(--qr-text)] shadow-[var(--qr-shadow-sm)] hover:bg-[color:var(--qr-hover)] disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button onClick={createNewChat} disabled={loading} className="w-full">
      {loading ? "Creating..." : "+ New Chat"}
    </Button>
  );
}
