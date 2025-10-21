"use client";

import { useEffect, useState } from "react";
import AddConnectionButton from "@/components/connections/AddConnectionButton";
import ConnectionList from "@/components/connections/ConnectionList";
import SchemaViewer from "@/components/connections/SchemaViewer";
import { useConnectionStore } from "@/lib/stores/connectionStore";
import { useChatStore } from "@/lib/stores/chatStore";
import { Plus, GripVertical } from "lucide-react";
import { Surface } from "@/components/brand/Surface";

export default function Sidebar({ connections = [], user = null }) {
  // Start expanded to match SSR; hydrate to saved value after mount
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectedConnection, setSelectedConnection, clearSelectedConnection } = useConnectionStore();
  const { currentDataSourceId } = useChatStore();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar:dataSources:collapsed') === '1';
      setIsCollapsed(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar:dataSources:collapsed', isCollapsed ? '1' : '0');
    } catch {}
  }, [isCollapsed]);

  useEffect(() => {
    if (!Array.isArray(connections) || connections.length === 0) {
      if (selectedConnection) {
        clearSelectedConnection();
      }
      return;
    }

    if (currentDataSourceId) {
      const match = connections.find((c) => c.id === currentDataSourceId);
      if (match) {
        if (selectedConnection !== match) {
          setSelectedConnection(match);
        }
        return;
      }
    }

    if (
      selectedConnection &&
      !connections.some((c) => c.id === selectedConnection.id)
    ) {
      clearSelectedConnection();
    }
  }, [connections, currentDataSourceId, selectedConnection, setSelectedConnection, clearSelectedConnection]);

  return (
    <aside
      className={`relative shrink-0 transition-all duration-200 h-full overflow-visible flex flex-col py-4 ${
        isCollapsed ? "w-20" : "w-80"
      }`}
    >
      <Surface variant="glass" className={`relative ${isCollapsed ? 'mx-2' : 'mx-3'} flex h-full flex-col rounded-3xl overflow-hidden`}>

        {/* Header */}
        <div className={`relative flex-shrink-0 ${isCollapsed ? 'px-2 py-3' : 'px-4 py-4'} border-b border-[var(--qr-border)]`}>
          {!isCollapsed && (
            <h2 className="text-xs font-semibold tracking-wide text-[var(--qr-text)]/70">Data Sources</h2>
          )}
        </div>

        {/* Content (scrollable list) */}
        <div className={`relative flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <ConnectionList connections={connections} isCollapsed={isCollapsed} />
          {!isCollapsed && selectedConnection?.schema_json?.length ? (
            <SchemaViewer schema={selectedConnection.schema_json} />
          ) : null}
        </div>

        {/* Footer (Add Connection) */}
        <div className={`relative flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-4'} border-t border-[var(--qr-border)]`}>
          {isCollapsed ? (
            <AddConnectionButton>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md border border-[var(--qr-border)] bg-[var(--qr-surface)] text-[var(--qr-text)] shadow-sm hover:bg-[color:var(--qr-hover)]"
                title="Add Connection"
              >
                <Plus className="h-4 w-4" />
              </button>
            </AddConnectionButton>
          ) : (
            <AddConnectionButton />
          )}
        </div>
      </Surface>
      {/* Edge-centered toggle button (drag-like pill slightly outside) */}
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 inline-flex h-16 w-8 items-center justify-center rounded-full border border-[var(--qr-border)] bg-[var(--qr-surface)] text-[var(--qr-text)] shadow-[var(--qr-shadow-sm)] hover:bg-[color:var(--qr-hover)] cursor-pointer backdrop-blur-md"
        title={isCollapsed ? "Expand" : "Collapse"}
        aria-pressed={isCollapsed}
      >
        <GripVertical className="h-5 w-5 opacity-70" />
      </button>
      
    </aside>
  );
}
