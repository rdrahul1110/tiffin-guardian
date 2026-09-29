import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Siren, BarChart3, Timer } from "lucide-react";
import { OpsView } from "@/components/tiffin/OpsView";
import { AnalyticsView } from "@/components/tiffin/AnalyticsView";
import { INITIAL_AUDIT, type AuditEntry, type City, type Resolution } from "@/lib/tiffin-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TiffinLoop — Ops Command Center" },
      { name: "description", content: "Resolve home-cook dropouts in minutes and track 30-day reliability across Bengaluru, Mumbai and Pune." },
      { property: "og:title", content: "TiffinLoop — Ops Command Center" },
      { property: "og:description", content: "Cook dropout resolution and leadership analytics for TiffinLoop meal subscriptions." },
    ],
  }),
  component: Index,
});

const CITIES = ["All", "Bengaluru", "Mumbai", "Pune"] as const;

function Index() {
  const [tab, setTab] = useState<"ops" | "analytics">("ops");
  const [city, setCity] = useState<City | "All">("All");
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [audit, setAudit] = useState<AuditEntry[]>(INITIAL_AUDIT);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="5" y="4" width="14" height="5" rx="1.5" /><rect x="5" y="10" width="14" height="5" rx="1.5" /><rect x="5" y="16" width="14" height="4" rx="1.5" /></svg>
            </div>
            <span className="text-base font-semibold tracking-tight">TiffinLoop</span>
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Ops</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs">
            <Clock className="h-3.5 w-3.5 text-primary" /> Wed, 23 Sep 2026, 10:30 AM
          </div>
          <div className="hidden items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive md:flex">
            <Timer className="h-3.5 w-3.5" /> Lunch dispatch 12:30 PM · 2h 00m left
          </div>
          <div className="ml-auto flex rounded-lg border border-border bg-card p-0.5">
            {CITIES.map((c) => (
              <button key={c} onClick={() => setCity(c)} className={cn("rounded-md px-3 py-1 text-xs font-medium transition", city === c ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>{c}</button>
            ))}
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-6 px-6">
          {([["ops", "Ops Command Center", Siren], ["analytics", "Leadership Analytics", BarChart3]] as const).map(([k, label, I]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("flex items-center gap-2 border-b-2 pb-2.5 pt-1 text-sm font-medium transition", tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              <I className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {tab === "ops" ? (
          <OpsView city={city} extra={extra} setExtra={setExtra} resolutions={resolutions} setResolutions={setResolutions} audit={audit} setAudit={setAudit} />
        ) : (
          <AnalyticsView city={city} />
        )}
      </main>
    </div>
  );
}
