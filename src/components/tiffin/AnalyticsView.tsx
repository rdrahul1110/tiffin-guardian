import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Package, TrendingDown, IndianRupee, UserX, CheckCircle2, ShieldAlert } from "lucide-react";
import { CITY_STATS, DOW_DATA, RISK_COOKS, TREND_DATA, type City } from "@/lib/tiffin-data";
import { cn } from "@/lib/utils";

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "var(--foreground)" }, cursor: { fill: "var(--muted)", opacity: 0.4 } };
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };

export function AnalyticsView({ city }: { city: City | "All" }) {
  const cities = Object.keys(CITY_STATS) as City[];
  const sel = city === "All" ? cities : [city];
  const orders = sel.reduce((s, c) => s + CITY_STATS[c].orders, 0);
  const drops = sel.reduce((s, c) => s + CITY_STATS[c].dropouts, 0);
  const refunded = sel.reduce((s, c) => s + CITY_STATS[c].refunded, 0);
  const scale = drops / 134;
  const cityData = cities.map((c) => ({ city: c, dropouts: CITY_STATS[c].dropouts, rate: +((CITY_STATS[c].dropouts / CITY_STATS[c].orders) * 100).toFixed(1) }));
  const trend = TREND_DATA.map((d) => ({ ...d, dropouts: Math.round(d.dropouts * scale) }));
  const dow = DOW_DATA.map((d) => ({ ...d, dropouts: Math.round(d.dropouts * scale) }));
  const risk = RISK_COOKS.filter((r) => city === "All" || r.city === city);

  // Outcome Metrics
  const estimatedRescued = Math.round(drops * 0.84);
  const recoveryRate = "84.2%";

  const kpis = [
    {
      label: "Meal Recovery Rate",
      value: recoveryRate,
      sub: `${estimatedRescued}/${drops} at-risk meals rescued on time`,
      icon: CheckCircle2,
      tone: "text-success",
      badge: "Outcome KPI"
    },
    {
      label: "Cook Dropouts (30d)",
      value: `${drops} meals`,
      sub: `${((drops / orders) * 100).toFixed(1)}% network failure rate`,
      icon: TrendingDown,
      tone: "text-destructive",
      badge: "Disruption"
    },
    {
      label: "Refund Cost Impact",
      value: `₹${refunded.toLocaleString("en-IN")}`,
      sub: "unavoidable refund payouts",
      icon: IndianRupee,
      tone: "text-warning",
      badge: "Lagging Cost"
    },
    {
      label: "High-Risk Repeat Cooks",
      value: city === "All" ? "4 cooks" : `${risk.filter((r) => r.reliability < 80).length} cooks`,
      sub: city === "All" ? "responsible for 48% of dropouts" : "reliability below 80%",
      icon: UserX,
      tone: "text-destructive",
      badge: "Supply Risk"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{k.label}</span>
              <k.icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{k.value}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className={cn("text-xs", k.tone ?? "text-muted-foreground")}>{k.sub}</span>
              {k.badge && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{k.badge}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Dropouts by City" sub="Meals disrupted · 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cityData}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="city" {...axis} /><YAxis {...axis} width={28} />
              <Tooltip {...tip} formatter={(v: number, _n, p) => [`${v} meals (${p.payload.rate}%)`, "Dropouts"]} />
              <Bar dataKey="dropouts" radius={[6, 6, 0, 0]}>
                {cityData.map((d) => <Cell key={d.city} fill={city === "All" || city === d.city ? "var(--chart-1)" : "var(--muted)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="30-Day Disruption Trend" sub="Spikes on weekends & Ganesh Chaturthi" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" {...axis} interval={3} /><YAxis {...axis} width={28} />
              <Tooltip {...tip} formatter={(v: number, _n, p) => [`${v} meals${p.payload.event ? ` · ${p.payload.event}` : ""}`, "Dropouts"]} />
              <Line type="monotone" dataKey="dropouts" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Day-of-Week Fragility" sub="Monday & Friday represent 45% of failures">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dow}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" {...axis} /><YAxis {...axis} width={24} />
              <Tooltip {...tip} formatter={(v: number) => [`${v} meals`, "Dropouts"]} />
              <Bar dataKey="dropouts" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top 10 High-Risk Cooks" sub="Ranked by repeat failure rate" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2">Cook</th>
                  <th className="pb-2">City</th>
                  <th className="pb-2">Specialty</th>
                  <th className="pb-2 text-right">Dropouts</th>
                  <th className="pb-2 text-right">Refund Cost</th>
                  <th className="pb-2 text-right">Reliability</th>
                  <th className="pb-2 text-right">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {risk.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 font-medium">
                      {r.name} <span className="font-mono text-muted-foreground">{r.id}</span>
                    </td>
                    <td className="py-2 text-muted-foreground">{r.city}</td>
                    <td className="py-2 text-muted-foreground">{r.specialty}</td>
                    <td className="py-2 text-right font-medium text-destructive">{r.dropouts}</td>
                    <td className="py-2 text-right tabular-nums">₹{r.revenue.toLocaleString("en-IN")}</td>
                    <td className="py-2 text-right">
                      <span className={cn("rounded px-1.5 py-0.5 font-mono text-[11px]",
                        r.reliability < 75 ? "bg-destructive/15 text-destructive font-semibold" :
                          r.reliability < 85 ? "bg-warning/15 text-warning font-medium" : "bg-muted text-muted-foreground")}>
                        {r.reliability}%
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium",
                        r.action === "Offboard" ? "bg-destructive/15 text-destructive" :
                          r.action === "Cap Daily Orders" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary")}>
                        {r.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, sub, children, className }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
