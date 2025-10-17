"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AILoading() {
  const steps = [
    "Consulting the data oracles…",
    "Politely asking the DB to behave…",
    "Untangling joins like spaghetti…",
    "Negotiating with stubborn indexes…",
    "Refactoring dad jokes into SQL…",
    "Dusting off the query planner…",
    "Giving DISTINCT a motivational speech…",
    "Indexing the unindexable (brb)…",
    "Convincing LEFT JOIN to actually join…",
    "Walking the execution plan, step by step…",
    "De-optimizing the optimizer (for science)…",
    "Teaching GROUP BY some table manners…",
    "Escaping rogue wildcards like a pro…",
    "Explaining nulls that nothing is something…",
    "Almost there… formatting results nicely…",
  ];

  const [idx, setIdx] = useState(() => Math.floor(Math.random() * steps.length));
  const [orderedSteps, setOrderedSteps] = useState(steps);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const containerRef = useRef(null);

  useEffect(() => {
    setOrderedSteps(shuffle(steps));
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % steps.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [idx]);

  return (
    <div ref={containerRef} className="w-full rounded-md border border-neutral-200 bg-white p-4 text-sm shadow dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-medium">Thinking…</span>
      </div>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">{orderedSteps[idx % orderedSteps.length] || steps[idx]}</p>
    </div>
  );
}
