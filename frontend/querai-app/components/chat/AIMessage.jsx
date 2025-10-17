"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Copy as CopyIcon, Check as CheckIcon } from "lucide-react";

export default function AIMessage({ content }) {
  const explanation = content?.explanation || content?.message || "";
  const sql = content?.sql_query || content?.sql || "";
  const data = Array.isArray(content?.data) ? content.data : [];

  const [copied, setCopied] = useState(false);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="w-full rounded-md border border-neutral-200 p-4 dark:border-neutral-800 max-h-[60vh] overflow-auto">
      <div className="flex-none">
        <Accordion type="multiple" defaultValue={["details"]}>
          {(explanation || sql) ? (
            <AccordionItem value="details">
              <AccordionTrigger>Explanation</AccordionTrigger>
              <AccordionContent>
                {explanation ? (
                  <p className="mb-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{explanation}</p>
                ) : null}
                {sql ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-500">Query</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={copySql}
                        aria-label={copied ? "Copied" : "Copy SQL"}
                      >
                        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <pre className="overflow-auto rounded bg-neutral-900 p-3 text-xs text-neutral-100"><code>{sql}</code></pre>
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ) : null}
        </Accordion>
      </div>

      <div>
        {data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  {Object.keys(data[0] || {}).map((k) => (
                    <th key={k} className="border-b border-neutral-200 px-3 py-2 font-medium dark:border-neutral-800">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="odd:bg-neutral-50 dark:odd:bg-neutral-900/50">
                    {Object.keys(data[0] || {}).map((k) => (
                      <td key={k} className="px-3 py-2 align-top">
                        {String(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (!explanation && !sql) ? (
          <pre className="overflow-auto rounded bg-neutral-100 p-3 text-xs dark:bg-neutral-900">
            {JSON.stringify(content, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
