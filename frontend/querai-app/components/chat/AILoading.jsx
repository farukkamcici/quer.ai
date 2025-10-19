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
    <div ref={containerRef} className="inline-flex max-w-[80%] flex-col rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-sm text-white shadow">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-medium">Thinking…</span>
        <span className="ml-1 inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/90 [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/90" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/90 [animation-delay:0.2s]" />
        </span>
      </div>
      <p className="mt-2 opacity-90">{orderedSteps[idx % orderedSteps.length] || steps[idx]}</p>
    </div>
  );
}
