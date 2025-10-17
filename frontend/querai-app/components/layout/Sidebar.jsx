"use client";

import { useState } from "react";
import AddConnectionButton from "@/components/connections/AddConnectionButton";
import ConnectionList from "@/components/connections/ConnectionList";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

export default function Sidebar({ connections = [] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`relative shrink-0 border-r border-neutral-200 p-4 transition-all duration-200 dark:border-neutral-800 h-full overflow-hidden ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className="absolute -right-3 top-4 z-10 rounded-full border border-neutral-200 bg-white p-1 shadow dark:border-neutral-800 dark:bg-neutral-900 cursor-pointer"
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      <div className={`${isCollapsed ? "opacity-0" : "opacity-100"} transition-opacity h-full overflow-y-auto`}> 
        <div className="mb-4">
          <AddConnectionButton />
        </div>
        <ConnectionList connections={connections} />
      </div>
    </aside>
  );
}
