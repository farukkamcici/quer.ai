"use client";

import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ListChevronsUpDown, ListChevronsDownUp, Table as TableIcon, Dot } from "lucide-react";

export default function SchemaViewer({ schema = [] }) {
  const groups = useMemo(() => {
    const list = Array.isArray(schema) ? schema : [];
    // Sort schemas by name, and ensure each has a tables array sorted by table_name
    return [...list]
      .map((s) => ({
        schema_name: s?.schema_name || "public",
        tables: Array.isArray(s?.tables)
          ? [...s.tables].map((t) => ({ table_name: t?.table_name || "", columns: Array.isArray(t?.columns) ? t.columns : [] }))
          : [],
      }))
      .sort((a, b) => a.schema_name.localeCompare(b.schema_name))
      .map((s) => ({
        ...s,
        tables: s.tables.sort((a, b) => (a.table_name || "").localeCompare(b.table_name || "")),
      }));
  }, [schema]);

  if (!groups.length) return null;

  // Precompute keys for expand/collapse all
  const allSchemaKeys = useMemo(() => groups.map((g) => `schema-${g.schema_name}`), [groups]);
  const allTableKeysBySchema = useMemo(() => {
    const acc = {};
    for (const g of groups) {
      acc[g.schema_name] = g.tables.map((t) => `table-${g.schema_name}-${t.table_name}`);
    }
    return acc;
  }, [groups]);

  const [openSchemas, setOpenSchemas] = useState([]);
  const [openTables, setOpenTables] = useState({});

  const expandAll = () => {
    setOpenSchemas(allSchemaKeys);
    setOpenTables(allTableKeysBySchema);
  };
  const collapseAll = () => {
    setOpenSchemas([]);
    setOpenTables({});
  };

  return (
    <div className="mt-4 rounded-lg border border-[var(--qr-border)] bg-[var(--qr-surface)] p-3 text-sm text-[var(--qr-text)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wide text-[color:var(--qr-subtle)]">Schema</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[color:var(--qr-subtle)] mr-1">
            {groups.reduce((acc, g) => acc + (g.tables?.length || 0), 0)} tables
          </span>
          <button
            type="button"
            onClick={expandAll}
            title="Expand all"
            aria-label="Expand all"
            className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-[var(--qr-border)] bg-[var(--qr-surface)] hover:bg-[color:var(--qr-hover)]"
          >
            <ListChevronsUpDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            title="Collapse all"
            aria-label="Collapse all"
            className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-[var(--qr-border)] bg-[var(--qr-surface)] hover:bg-[color:var(--qr-hover)]"
          >
            <ListChevronsDownUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto pr-1">
        <Accordion type="multiple" className="w-full" value={openSchemas} onValueChange={setOpenSchemas}>
          {groups.map((schemaGroup, sIdx) => (
            <AccordionItem key={schemaGroup.schema_name + sIdx} value={`schema-${schemaGroup.schema_name}`}>
              <AccordionTrigger className="px-1">
                <span className="truncate">{schemaGroup.schema_name}</span>
                <span className="ml-2 text-[10px] text-[color:var(--qr-subtle)]">{schemaGroup.tables.length}</span>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion
                  type="multiple"
                  className="w-full pl-3"
                  value={openTables[schemaGroup.schema_name] || []}
                  onValueChange={(vals) => setOpenTables((prev) => ({ ...prev, [schemaGroup.schema_name]: vals }))}
                >
                  {schemaGroup.tables.map((t, tIdx) => {
                    const tableKey = `table-${schemaGroup.schema_name}-${t.table_name}`;
                    return (
                      <AccordionItem key={t.table_name + tIdx} value={tableKey}>
                        <AccordionTrigger className="px-1">
                          <span className="inline-flex items-center gap-2 truncate">
                            <TableIcon className="h-3.5 w-3.5 opacity-70" />
                            {t.table_name}
                          </span>
                          <span className="ml-2 text-[10px] text-[color:var(--qr-subtle)]">{t.columns.length}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                        {t.columns.length ? (
                          <div className="pl-4 space-y-1">
                            {t.columns.map((c, cIdx) => {
                              const name = typeof c === 'string' ? c : (c?.name || '');
                              const typ = typeof c === 'object' ? (c?.type || '') : '';
                              return (
                                <div key={name + cIdx} className="flex items-center justify-between gap-2 truncate text-[13px] text-[var(--qr-text)]">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Dot className="h-4 w-4 -ml-1 opacity-60 shrink-0" />
                                    <span className="font-mono truncate">{name}</span>
                                  </div>
                                  {typ ? (
                                    <span className="ml-2 shrink-0 rounded-full border border-[var(--qr-border)] bg-[color:var(--qr-hover)] px-2 py-0.5 text-[10px] text-[color:var(--qr-text)]/80">
                                      {String(typ).toLowerCase()}
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-[color:var(--qr-subtle)]">No columns detected</div>
                        )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
