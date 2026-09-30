import { useMemo, useState } from "react";
import {
  AlertTriangle, MessageCircle, ChevronsUpDown, Check, ChefHat, MapPin, UtensilsCrossed, Siren, Sun, Moon,
  Sparkles, ArrowRight, Send, Smartphone, History, User, Zap, Ban, Phone, Search, Timer, ShieldAlert,
  Clock, CheckCircle2, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  COOKS, INCIDENTS, ORDERS, allocate, allocateBatch, cookById, eligibleBackups, remaining, sub,
  type Allocation, type AuditEntry, type City, type Cook, type Order, type Resolution,
} from "@/lib/tiffin-data";
import { DietBadge, StatusBadge } from "./badges";
import { cn } from "@/lib/utils";

interface Props {
  city: City | "All";
  extra: Record<string, number>;
  setExtra: (e: Record<string, number>) => void;
  resolutions: Record<string, Resolution>;
  setResolutions: (r: Record<string, Resolution>) => void;
  audit: AuditEntry[];
  setAudit: (a: AuditEntry[]) => void;
}

const Panel = ({ title, icon: I, right, children, className }: { title: string; icon: typeof Siren; right?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={cn("rounded-xl border border-border bg-card", className)}>
    <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><I className="h-4 w-4 text-muted-foreground" />{title}</h2>
      {right}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

export function OpsView({ city, extra, setExtra, resolutions, setResolutions, audit, setAudit }: Props) {
  const [cookId, setCookId] = useState<string | null>(null);
  const [declared, setDeclared] = useState(false);
  const [allocs, setAllocs] = useState<Allocation[] | null>(null);
  const [pendingUsed, setPendingUsed] = useState<Record<string, number> | null>(null);
  const [modal, setModal] = useState(false);
  const [sent, setSent] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [confirmedIncidents, setConfirmedIncidents] = useState<Record<string, boolean>>({
    CK086: true,
    CK087: true,
    CK090: false, // Starts as detected/unverified
  });

  const cook = cookId ? cookById(cookId) : undefined;
  const incident = INCIDENTS.find((i) => i.cookId === cookId);
  const orders = useMemo(() => ORDERS.filter((o) => o.cookId === cookId), [cookId]);
  const incidents = INCIDENTS.filter((i) => city === "All" || cookById(i.cookId)!.city === city);
  const cookList = COOKS.filter((c) => city === "All" || c.city === city);

  // Unresolved counts across all open incidents today
  const allIncidentCookIds = INCIDENTS.map(i => i.cookId);
  const totalIncidentOrders = ORDERS.filter(o => allIncidentCookIds.includes(o.cookId));
  const unresolvedTotal = totalIncidentOrders.filter(o => !resolutions[o.id] || resolutions[o.id] === "Unresolved").length;
  const openIncidentsCount = incidents.filter(i => {
    const incOrders = ORDERS.filter(o => o.cookId === i.cookId);
    return incOrders.some(o => !resolutions[o.id] || resolutions[o.id] === "Unresolved");
  }).length;

  const select = (id: string) => {
    setIsBatchMode(false);
    setCookId(id); setDeclared(false); setAllocs(null); setSent(false); setOpen(false); setQuery("");
    const already = ORDERS.filter((o) => o.cookId === id).some((o) => resolutions[o.id] && resolutions[o.id] !== "Unresolved");
    if (already) { setDeclared(true); setSent(true); }
  };

  const confirmIncident = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmedIncidents(prev => ({ ...prev, [id]: true }));
    toast.success(`Incident for ${id} confirmed by Ops`, {
      description: "Dropout verified. Ready for backup allocation."
    });
  };

  const useCustom = () => {
    const id = query.trim().toUpperCase();
    const c = cookById(id);
    if (c) select(c.id);
    else toast.error(`Cook ID "${id}" not found in roster`, { description: "Check the ops spreadsheet for the correct ID." });
  };

  const runAllocate = () => {
    if (!cook) return;
    const { result, used } = allocate(cook, orders, extra);
    setAllocs(result); setPendingUsed(used);
    setModal(true);
  };

  const runBatchAllocate = () => {
    setIsBatchMode(true);
    // Find all unresolved orders across all incidents in current city
    const targetOrders = totalIncidentOrders.filter(o => {
      const c = cookById(o.cookId);
      const cityMatch = city === "All" || (c && c.city === city);
      const isUnresolved = !resolutions[o.id] || resolutions[o.id] === "Unresolved";
      return cityMatch && isUnresolved;
    });

    if (targetOrders.length === 0) {
      toast.info("All incidents are already fully resolved!");
      return;
    }

    const { result, used } = allocateBatch(targetOrders, extra);
    setAllocs(result);
    setPendingUsed(used);
    setModal(true);
  };

  const sendAll = () => {
    if (!allocs || !pendingUsed) return;
    const r = { ...resolutions };
    allocs.forEach((a) => (r[a.orderId] = a.backupCookId ? "Reassigned" : "Refunded"));
    setResolutions(r); setExtra(pendingUsed); setSent(true); setModal(false);

    const backups = [...new Set(allocs.filter((a) => a.backupCookId).map((a) => a.backupCookId!))];
    const refunds = allocs.filter((a) => !a.backupCookId).length;

    const droppedLabel = isBatchMode
      ? `Global Batch (${allocs.length} meals across ${openIncidentsCount} cooks)`
      : `${cook?.name} (${cook?.id})`;

    setAudit([{
      id: `A-${1043 + audit.length - 4}`,
      timestamp: "23 Sep, 10:30 AM",
      droppedCook: droppedLabel,
      affected: allocs.length,
      reassignedTo: backups.map((b) => `${b} ${cookById(b)?.name}`).join(", ") || "—",
      refunds,
      operator: "Rahul D.",
      status: "Sent",
    }, ...audit]);

    setConfetti(true);
    setTimeout(() => setConfetti(false), 3200);
    toast.success(`${allocs.length} notifications sent`, {
      description: `${allocs.length - refunds} reassigned (${Math.round(((allocs.length - refunds) / allocs.length) * 100)}% rescued) · ${refunds} refunded`
    });
  };

  const allocOf = (o: Order) => allocs?.find((a) => a.orderId === o.id);

  return (
    <div className="space-y-6">
      {confetti && <Confetti />}

      {/* Emergency Urgency Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/40 bg-gradient-to-r from-destructive/15 via-destructive/5 to-card px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
          </span>
          <div>
            <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight text-destructive">
              <Clock className="h-4 w-4" />
              <span>01:28:40 TO LUNCH DISPATCH (12:30 PM)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{unresolvedTotal} meals</strong> at immediate risk · <strong className="text-foreground">{openIncidentsCount} cook dropout(s)</strong> awaiting resolution
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={runBatchAllocate}
            disabled={unresolvedTotal === 0}
            className="gap-1.5 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Solve All Incidents (Global Batch Rescue)
          </Button>
        </div>
      </div>

      {/* Ticker / Incident Cards */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-4 w-4 text-success" /> Morning WhatsApp Incidents
            <span className="font-normal text-muted-foreground">· auto-ingested from ops chat</span>
          </div>
          <span className="text-xs text-muted-foreground">{incidents.length} active crises</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {incidents.map((inc) => {
            const c = cookById(inc.cookId)!;
            const n = ORDERS.filter((o) => o.cookId === c.id).length;
            const isConfirmed = confirmedIncidents[inc.cookId] ?? (inc.lifecycleState === "confirmed");
            const done = ORDERS.filter((o) => o.cookId === c.id).every((o) => resolutions[o.id] && resolutions[o.id] !== "Unresolved");

            return (
              <div
                key={c.id}
                onClick={() => select(c.id)}
                className={cn(
                  "group relative cursor-pointer rounded-lg border bg-card p-3 text-left transition hover:border-primary/60 hover:shadow-md",
                  cookId === c.id ? "border-primary ring-1 ring-primary" : !isConfirmed ? "border-warning/60 bg-warning/5" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isConfirmed ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <Siren className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{c.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{inc.receivedAt}</span>
                </div>

                <p className="mt-2 line-clamp-1 text-xs italic text-muted-foreground">“{inc.message}”</p>

                {/* Repeat Offender Badge */}
                {inc.repeatCount > 1 && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-destructive">
                    <ShieldAlert className="h-3 w-3" />
                    <span>Repeat Dropout: #{inc.repeatCount} this month (Reliability: {inc.reliabilityScore}%)</span>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded bg-muted px-1.5 py-0.5">{c.city}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5">{n} orders</span>
                  
                  {done ? (
                    <span className="rounded bg-success/15 px-1.5 py-0.5 font-medium text-success">✓ Resolved</span>
                  ) : !isConfirmed ? (
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-warning/15 px-1.5 py-0.5 font-medium text-warning">
                        🔍 Detected (Unverified)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 px-1.5 text-[10px]"
                        onClick={(e) => confirmIncident(inc.cookId, e)}
                      >
                        Confirm
                      </Button>
                    </div>
                  ) : (
                    <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-destructive font-medium">
                      🔴 Confirmed Dropout
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {!incidents.length && <p className="text-sm text-muted-foreground">No incidents in this city this morning.</p>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Selector */}
        <Panel title="Cook Dropout Selector" icon={ChefHat}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                {cook ? <span><span className="font-mono text-xs text-muted-foreground">{cook.id}</span> · {cook.name}</span> : <span className="text-muted-foreground">Search cook name or ID…</span>}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Name or ID (e.g. CK014)" value={query} onValueChange={setQuery}
                  onKeyDown={(e) => { if (e.key === "Enter" && query && !cookList.some((c) => `${c.id} ${c.name}`.toLowerCase().includes(query.toLowerCase()))) useCustom(); }} />
                <CommandList>
                  <CommandEmpty>
                    <button onClick={useCustom} className="flex w-full items-center justify-center gap-2 text-sm"><Search className="h-3.5 w-3.5" />Look up custom ID “{query.toUpperCase()}”</button>
                  </CommandEmpty>
                  <CommandGroup>
                    {cookList.map((c) => (
                      <CommandItem key={c.id} value={`${c.id} ${c.name}`} onSelect={() => select(c.id)}>
                        <Check className={cn("h-4 w-4", cookId === c.id ? "opacity-100" : "opacity-0")} />
                        <span className="font-mono text-xs text-muted-foreground">{c.id}</span> {c.name}
                        <span className="ml-auto text-xs text-muted-foreground">{c.city}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {cook ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">{cook.name.split(" ").map((w) => w[0]).join("")}</div>
                <div>
                  <div className="font-semibold">{cook.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{cook.phone}</div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={MapPin} label="City" value={cook.city} />
                <Info icon={UtensilsCrossed} label="Today's meals" value={String(orders.length)} />
                <div className="col-span-2"><Info icon={ChefHat} label="Specialty" value={cook.specialty} /></div>
                <div className="col-span-2">
                  <dt className="mb-1 text-xs text-muted-foreground">Serves</dt>
                  <dd className="flex gap-1.5">{cook.serves.map((d) => <DietBadge key={d} diet={d} />)}</dd>
                </div>
              </dl>
              {incident && (
                <div className="rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                  <MessageCircle className="mr-1 inline h-3 w-3 text-success" />
                  {incident.receivedAt}: “{incident.message}”
                </div>
              )}
              <Button className="w-full" size="lg" variant={declared ? "secondary" : "destructive"} disabled={declared || !orders.length} onClick={() => setDeclared(true)}>
                <Siren className="h-4 w-4" /> {declared ? "Dropout Confirmed & Active" : "Declare Dropout & Find Solutions"}
              </Button>
              {!orders.length && <p className="text-center text-xs text-muted-foreground">No orders scheduled today for this cook.</p>}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <ChefHat className="mx-auto mb-2 h-6 w-6" />Pick an incident above or search the roster.
            </div>
          )}
        </Panel>

        {/* Affected */}
        <Panel title="Affected Subscribers" icon={User} right={declared && <span className="text-xs text-muted-foreground">{orders.length} orders · ₹{orders.reduce((s, o) => s + o.amount, 0).toLocaleString("en-IN")}</span>}>
          {!declared ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Select or confirm a cook dropout above to view impacted orders.
            </div>
          ) : (
            <div className="space-y-5">
              {(["Lunch", "Dinner"] as const).map((meal) => {
                const list = orders.filter((o) => o.meal === meal);
                if (!list.length) return null;
                return (
                  <div key={meal}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {meal === "Lunch" ? <Sun className="h-3.5 w-3.5 text-primary" /> : <Moon className="h-3.5 w-3.5 text-chart-2" />}
                      {meal} · {meal === "Lunch" ? "12:30 PM (Urgent)" : "7:30 PM"} <span className="normal-case tracking-normal">({list.length})</span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                          <tr>{["Order ID", "Subscriber", "Phone", "Meal", "Cuisine", "Diet", "Amount", "Status"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {list.map((o) => {
                            const s = sub(o);
                            return (
                              <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                                <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                                <td className="px-3 py-2 font-medium">{s.name}</td>
                                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.phone}</td>
                                <td className="px-3 py-2">{o.meal}</td>
                                <td className="px-3 py-2 text-muted-foreground">{s.cuisine}</td>
                                <td className="px-3 py-2"><DietBadge diet={s.diet} /></td>
                                <td className="px-3 py-2 tabular-nums">₹{o.amount}</td>
                                <td className="px-3 py-2"><StatusBadge status={resolutions[o.id] ?? "Unresolved"} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {declared && cook && (
        <Engine
          cook={cook}
          orders={orders}
          extra={extra}
          allocs={allocs}
          sent={sent}
          onRun={runAllocate}
          onPreview={() => setModal(true)}
          allocOf={allocOf}
        />
      )}

      {/* Audit */}
      <Panel title="Traceability Audit Log" icon={History}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>{["Timestamp", "Dropped Cook / Scope", "Affected", "Reassigned To", "Refunds", "Operator", "Status"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {audit.filter((a) => city === "All" || COOKS.find((c) => a.droppedCook.includes(c.id))?.city === city || a.droppedCook.includes("Global")).map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{a.timestamp}</td>
                  <td className="px-3 py-2 font-medium">{a.droppedCook}</td>
                  <td className="px-3 py-2 tabular-nums">{a.affected}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.reassignedTo}</td>
                  <td className="px-3 py-2 tabular-nums">{a.refunds}</td>
                  <td className="px-3 py-2">{a.operator}</td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                      a.status === "Partial" ? "bg-warning/15 text-warning" : a.status === "Sent" ? "bg-primary/15 text-primary" : "bg-success/15 text-success")}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Messages modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Subscriber Notifications Preview {isBatchMode && "(Global Batch Mode)"}
            </DialogTitle>
            <DialogDescription>
              Personalized WhatsApp + SMS messages for {allocs?.length} subscribers. Review algorithm matches before sending.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {allocs?.map((a) => {
              const o = ORDERS.find((x) => x.id === a.orderId)!;
              const s = sub(o);
              const originalCook = cookById(o.cookId);
              const first = s.name.split(" ")[0] ?? s.name;
              const b = a.backupCookId ? cookById(a.backupCookId) : null;
              const inc = INCIDENTS.find(i => i.cookId === o.cookId);
              const phrase = inc?.reasonPhrase ?? "unavailable";
              const msg = b
                ? `Hi ${first}, your cook ${originalCook?.name} is ${phrase} today. We have reassigned your ${s.diet} ${s.cuisine} ${o.meal.toLowerCase()} to ${b.name}. Delivered on time by ${o.meal === "Lunch" ? "1:00 PM" : "8:00 PM"}. 🍱`
                : `Hi ${first}, your cook is unavailable today and nearby kitchens are at full capacity. We have initiated a full refund of ₹${o.amount} to your UPI + added a ₹50 credit. 🙏`;
              
              return (
                <div key={a.orderId} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{first[0]}</div>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="font-mono">{s.phone}</span>
                      {a.score !== undefined && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.2 font-mono text-[10px] text-primary">
                          Match: {a.score}%
                        </span>
                      )}
                      <span className={cn("ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium", b ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                        {b ? `Reassigned to ${b.name}` : "Refunded"}
                      </span>
                    </div>
                    {a.matchBreakdown && (
                      <div className="mb-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                        {a.matchBreakdown.map((r, i) => (
                          <span key={i} className="rounded bg-muted px-1.5 py-0.5">{r}</span>
                        ))}
                      </div>
                    )}
                    <div className="rounded-lg rounded-tl-none border border-success/20 bg-success/10 px-3 py-2 text-sm">{msg}
                      <div className="mt-1 text-right text-[10px] text-muted-foreground">10:31 AM {sent ? "✓✓" : "✓"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Channels: WhatsApp Business · SMS fallback</span>
            <Button onClick={sendAll} disabled={sent}><Send className="h-4 w-4" />{sent ? "Sent" : "Confirm All & Send Notifications"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ icon: I, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground"><I className="h-3 w-3" />{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function Engine({ cook, orders, extra, allocs, sent, onRun, onPreview, allocOf }: {
  cook: Cook; orders: Order[]; extra: Record<string, number>; allocs: Allocation[] | null; sent: boolean;
  onRun: () => void; onPreview: () => void; allocOf: (o: Order) => Allocation | undefined;
}) {
  const diets = [...new Set(orders.map((o) => sub(o).diet))];
  const backups = [...new Map(diets.flatMap((d) => eligibleBackups(cook, d, extra)).map((c) => [c.id, c])).values()];
  const needed = orders.length;
  const refunds = allocs?.filter((a) => !a.backupCookId).length ?? 0;

  return (
    <Panel title="Explainable Backup Allocation Engine" icon={Sparkles}
      right={<div className="flex gap-2">
        {allocs && <Button size="sm" variant="outline" onClick={onPreview}>Review Match Breakdown</Button>}
        <Button size="sm" onClick={onRun} disabled={sent}><Zap className="h-4 w-4" />{sent ? "Allocated & Sent" : "Auto-Allocate Backups & Preview Messages"}</Button>
      </div>}>
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>Rules: <b className="text-foreground">same city ({cook.city})</b></span>
        <span><b className="text-foreground">strict diet match</b> (Jain → Jain-certified only)</span>
        <span>Scarcity-first: Jain orders allocated first</span>
        <span>Ranked by: Cuisine match + Kitchen capacity + Reliability score</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {backups.map((b) => {
          const rem = remaining(b, extra);
          const assigned = allocs?.filter((a) => a.backupCookId === b.id).length ?? 0;
          const free = b.capacity - b.booked - (extra[b.id] ?? 0);
          const pctBooked = ((b.capacity - free) / b.capacity) * 100;
          const pctNew = (assigned / b.capacity) * 100;
          const low = rem <= 3;
          return (
            <div key={b.id} className={cn("rounded-lg border p-3", assigned ? "border-success/40 bg-success/5" : "border-border")}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{b.id}</span>{" "}
                  <span className="font-medium">{b.name}</span>
                </div>
                {assigned > 0 && <span className="rounded bg-success/15 px-1.5 py-0.5 text-[11px] font-medium text-success">+{assigned} assigned</span>}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{b.specialty}</span>
                <span className="font-mono text-[11px] text-primary">{b.reliabilityScore}% reliability</span>
              </div>
              <div className="mt-1.5 flex gap-1">{b.serves.map((d) => <DietBadge key={d} diet={d} />)}</div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Remaining capacity</span>
                <span className={cn("font-mono font-medium", low ? "text-warning" : "text-foreground")}>{rem}/{b.capacity} slots</span>
              </div>
              <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted">
                <div className="bg-muted-foreground/40" style={{ width: `${pctBooked}%` }} />
                <div className="bg-success transition-all duration-700" style={{ width: `${pctNew}%` }} />
              </div>
              {low && <p className="mt-2 flex items-center gap-1 text-[11px] text-warning"><AlertTriangle className="h-3 w-3" />Near capacity</p>}
            </div>
          );
        })}
        {!backups.length && <p className="text-sm text-muted-foreground">No eligible backup cooks in {cook.city}.</p>}
      </div>

      {allocs && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-3 text-xs">
            <span className="font-medium">Allocation plan</span>
            <span className="text-success font-medium">{needed - refunds} meals reassigned ({Math.round(((needed - refunds) / needed) * 100)}% rescued)</span>
            {refunds > 0 && <span className="flex items-center gap-1 text-destructive"><Ban className="h-3 w-3" />{refunds} capacity conflict → refund</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {orders.map((o) => {
              const a = allocOf(o)!; const s = sub(o); const b = a.backupCookId ? cookById(a.backupCookId) : null;
              return (
                <div key={o.id} className="flex flex-col gap-1 rounded-md border border-border bg-muted/20 p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">{o.id}</span>
                    <span className="truncate font-medium">{s.name}</span>
                    <DietBadge diet={s.diet} />
                    <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                    {b ? (
                      <span className="shrink-0 font-medium text-success">{b.name}</span>
                    ) : (
                      <span className="shrink-0 font-medium text-destructive">Refund ₹{o.amount}</span>
                    )}
                  </div>
                  {a.matchBreakdown && (
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {a.score !== undefined && (
                        <span className="rounded bg-primary/15 font-semibold text-primary px-1">
                          {a.score}% Match
                        </span>
                      )}
                      {a.matchBreakdown.map((r, idx) => (
                        <span key={idx} className="rounded bg-muted px-1 py-0.2">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

function Confetti() {
  const colors = ["var(--primary)", "var(--success)", "var(--chart-2)", "var(--destructive)", "var(--chart-5)"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {Array.from({ length: 90 }).map((_, i) => (
        <span key={i} className="absolute top-0 block h-2.5 w-1.5 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animation: `confetti-fall ${2 + (i % 7) * 0.2}s ${(i % 10) * 0.05}s ease-in forwards` }} />
      ))}
    </div>
  );
}
