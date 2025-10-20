"use client";

import { useState } from "react";
import { useConnectionStore } from "@/lib/stores/connectionStore";
import { useChatStore } from "@/lib/stores/chatStore";
import AddConnectionButton from "@/components/connections/AddConnectionButton";
import { deleteConnection, refreshConnection } from "@/app/actions/connections";
import { Database, FileSpreadsheet, Pencil, Trash2, RotateCw, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConnectionList({ connections = [], isCollapsed = false }) {
  const { selectedConnection, setSelectedConnection } = useConnectionStore();
  const { currentChatId, setMessages, setChatId, setDataSource } = useChatStore();
  const router = useRouter();
  const [refreshingId, setRefreshingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [pendingConn, setPendingConn] = useState(null);

  async function handleSelectConnection(c, isActive) {
    // Same click on active: keep existing toggle behavior (deselect)
    if (isActive) {
      const next = null;
      setSelectedConnection(next);
      setDataSource(null);
      return;
    }

    // If a chat exists, ask to start a new chat bound to this source
    if (currentChatId) {
      setPendingConn(c);
      setSwitchOpen(true);
      return;
    }

    // No chat exists: just select; ChatInterface will auto-create
    setSelectedConnection(c);
    setDataSource(c ? c.id : null);
  }

  async function confirmSwitchToPending() {
    if (!pendingConn) return;
    try {
      setCreating(true);
      const res = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_source_id: pendingConn.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.chat_id) {
        setMessages([]);
        setChatId(data.chat_id);
        setSelectedConnection(pendingConn);
        setDataSource(pendingConn.id);
        try { localStorage.setItem('currentChatId', data.chat_id); } catch {}
        try { window.dispatchEvent(new CustomEvent('chat:refresh-list')); } catch {}
        setSwitchOpen(false);
        setPendingConn(null);
      } else {
        toast.error(data?.error || 'Failed to start a new chat for this source.');
      }
    } finally {
      setCreating(false);
    }
  }

  if (!connections.length) {
    if (isCollapsed) {
      return (
        <div className="flex h-full items-center justify-center">
          <div
            title="No data sources"
            className="w-12 h-12 rounded-xl border border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/10 backdrop-blur-md flex items-center justify-center"
          >
            <Database className="h-5 w-5 text-neutral-600 dark:text-neutral-300 opacity-70" />
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-neutral-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur p-4 text-sm text-neutral-600 dark:text-neutral-300">
        No connections yet.
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {connections.map((c) => {
          const isActive = selectedConnection?.id === c.id;
          if (isCollapsed) {
            return (
              <li key={c.id}>
                <button
                  type="button"
                onClick={() => handleSelectConnection(c, isActive)}
                  className={`w-10 h-10 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                    isActive
                      ? 'border-green-500'
                      : 'border-[var(--qr-border)] hover:bg-[color:var(--qr-hover)]'
                  }`}
                  aria-pressed={isActive}
                  title={`${c.name} • ${c.source_type}`}
                  disabled={creating}
                >
                {(() => { const st = String(c?.source_type || '').toLowerCase(); return (st === 'csv' || st === 'excel'); })() ? (
                  <FileSpreadsheet className={`h-4 w-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-[color:var(--qr-subtle)]'}`} />
                ) : (
                  <Database className={`h-4 w-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-[color:var(--qr-subtle)]'}`} />
                )}
              </button>
            </li>
          )
        }
        return (
          <li key={c.id}>
            <div
              className={`flex w-full items-start justify-between rounded border p-3 text-left text-sm transition-colors ${
                isActive
                  ? 'border-green-500'
                  : 'border-[var(--qr-border)] hover:bg-[color:var(--qr-hover)]'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectConnection(c, isActive)}
                className="flex flex-1 items-start gap-2 text-left cursor-pointer"
                aria-pressed={isActive}
                disabled={creating}
              >
                {(() => { const st = String(c?.source_type || '').toLowerCase(); return (st === 'csv' || st === 'excel'); })() ? (
                  <FileSpreadsheet className={`mt-0.5 h-4 w-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-[color:var(--qr-subtle)]'}`} />
                ) : (
                  <Database className={`mt-0.5 h-4 w-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-[color:var(--qr-subtle)]'}`} />
                )}
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-[color:var(--qr-subtle)]">{c.source_type}</div>
                </div>
              </button>
              <div className="ml-2 flex items-center gap-1">
                <button
                  type="button"
                  className="rounded p-1 text-[color:var(--qr-text)] hover:bg-[color:var(--qr-hover)] cursor-pointer"
                  title="Refresh schema"
                  aria-busy={refreshingId === c.id}
                  disabled={refreshingId === c.id}
                  onClick={async () => {
                    try {
                      setRefreshingId(c.id);
                      const res = await refreshConnection(c.id);
                      if (res?.success) {
                        toast.success('Schema refreshed.');
                        router.refresh();
                      } else {
                        toast.error(res?.error || 'Failed to refresh schema');
                      }
                    } finally {
                      setRefreshingId(null);
                    }
                  }}
                >
                  {refreshingId === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
                </button>
                <AddConnectionButton connection={c}>
                  <button
                    type="button"
                    className="rounded p-1 text-[color:var(--qr-text)] hover:bg-[color:var(--qr-hover)] cursor-pointer"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </AddConnectionButton>
                <ConfirmDeleteButton
                  onConfirm={async () => {
                    const res = await deleteConnection(c.id);
                    if (res?.success) {
                      toast.success('Connection deleted.');
                      router.refresh();
                      if (selectedConnection?.id === c.id) setSelectedConnection(null);
                    } else {
                      toast.error(res?.error || 'Failed to delete connection');
                    }
                  }}
                />
              </div>
            </div>
          </li>
        );
        })}
      </ul>

      {/* Confirm Switch Dialog */}
      <Dialog open={switchOpen} onOpenChange={(v) => { setSwitchOpen(v); if (!v) setPendingConn(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch data source?</DialogTitle>
            <DialogDescription className="text-[var(--qr-text)]">
                  {pendingConn ? (
                    <>
                      This will start a new chat bound to <b>{pendingConn.name}</b>
                      {" "}
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-[var(--qr-border)] bg-[var(--qr-surface)] px-2 py-0.5 text-[11px] text-[color:var(--qr-text)]/80">
                    {(() => { const st = String(pendingConn?.source_type || '').toLowerCase(); return (st === 'csv' || st === 'excel'); })() ? (
                      <FileSpreadsheet className="h-3.5 w-3.5 opacity-70" />
                    ) : (
                      <Database className="h-3.5 w-3.5 opacity-70" />
                    )}
                    <span className="uppercase tracking-wide">{pendingConn.source_type}</span>
                  </span>
                  . Your current chat will remain in the list.
                </>
              ) : (
                <>This will start a new chat bound to the selected source.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setSwitchOpen(false); setPendingConn(null); }} disabled={creating}>Cancel</Button>
            <Button onClick={confirmSwitchToPending} disabled={creating}>
              {creating ? 'Starting…' : (
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Start New Chat
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmDeleteButton({ onConfirm }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 cursor-pointer"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove connection</DialogTitle>
          <DialogDescription className="text-[var(--qr-text)]">Are you sure you want to delete this data source? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await onConfirm?.();
                setOpen(false);
              } catch (e) {
                setOpen(false);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
