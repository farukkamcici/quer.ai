"use client";

import { useState } from "react";
import { useConnectionStore } from "@/lib/stores/connectionStore";
import AddConnectionButton from "@/components/connections/AddConnectionButton";
import { deleteConnection } from "@/app/actions/connections";
import { Database, Pencil, Trash2 } from "lucide-react";
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
  const router = useRouter();

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
    <ul className="space-y-2">
      {connections.map((c) => {
        const isActive = selectedConnection?.id === c.id;
        if (isCollapsed) {
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelectedConnection(isActive ? null : c)}
                className={`w-10 h-10 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                  isActive
                    ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/30'
                    : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900'
                }`}
                aria-pressed={isActive}
                title={`${c.name} • ${c.source_type}`}
              >
                <Database className={`h-4 w-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-neutral-500'}`} />
              </button>
            </li>
          )
        }
        return (
          <li key={c.id}>
            <div
              className={`flex w-full items-start justify-between rounded border p-3 text-left text-sm transition-colors ${
                isActive
                  ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/30'
                  : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedConnection(isActive ? null : c)}
                className="flex flex-1 items-start gap-2 text-left cursor-pointer"
                aria-pressed={isActive}
              >
                <Database className={`mt-0.5 h-4 w-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-neutral-500'}`} />
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-neutral-500">{c.source_type}</div>
                </div>
              </button>
              <div className="ml-2 flex items-center gap-1">
                <AddConnectionButton connection={c}>
                  <button
                    type="button"
                    className="rounded p-1 text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700 cursor-pointer"
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
          <DialogDescription>Are you sure you want to delete this data source? This action cannot be undone.</DialogDescription>
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
