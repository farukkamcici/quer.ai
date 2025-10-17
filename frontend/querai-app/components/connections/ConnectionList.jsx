"use client";

import { useConnectionStore } from "@/lib/stores/connectionStore";
import AddConnectionButton from "@/components/connections/AddConnectionButton";
import { deleteConnection } from "@/app/actions/connections";
import { Database, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ConnectionList({ connections = [] }) {
  const { selectedConnection, setSelectedConnection } = useConnectionStore();
  const router = useRouter();

  if (!connections.length) {
    return <p className="text-sm text-neutral-500">No connections yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {connections.map((c) => {
        const isActive = selectedConnection?.id === c.id;
        return (
          <li key={c.id}>
            <div
              className={`flex w-full items-start justify-between rounded border p-3 text-left text-sm transition-colors ${
                isActive
                  ? "border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800"
                  : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
              }`}
            >
              <button type="button" onClick={() => setSelectedConnection(c)} className="flex flex-1 items-start gap-2 text-left cursor-pointer">
                <Database className="mt-0.5 h-4 w-4 text-neutral-500" />
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
                <form
                  action={async () => {
                    const ok = typeof window === 'undefined' ? true : confirm("Are you sure you want to delete this connection?");
                    if (!ok) return;
                    const res = await deleteConnection(c.id);
                    if (res?.success) {
                      toast.success('Connection deleted.');
                      router.refresh();
                      if (selectedConnection?.id === c.id) {
                        setSelectedConnection(null);
                      }
                    } else {
                      toast.error(res?.error || 'Failed to delete connection');
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
