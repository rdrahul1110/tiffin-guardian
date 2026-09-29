import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot } from "recharts";
import { Package, TrendingDown, IndianRupee, UserX, Trophy, ShieldAlert } from "lucide-react";
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
  const maxDow = Math.max(...dow.map((d) => d.dropouts));

  const kpis = [
    { label: "Total Orders (30d)", value: orders.toLocaleString("en-IN"), sub: "Aug 25 – Sep 23", icon: Package },
    { label: "Cook Dropouts", value: `${drops} meals`, sub: `${((drops / orders) * 100).toFixed(1)}% failure rate`, icon: TrendingDown, tone: "text-destructive" },
    { label: "Financial Impact", value: `₹${refunded.toLocaleString("en-IN")}`, sub: "refunded due to no-shows", icon: IndianRupee, tone: "text-warning" },
    { label: "High-Risk Repeat Cooks", value: city === "All" ? "4 cooks" : `${risk.filter((r) => r.reliability < 80).length} cooks`, sub: city === "All" ? "responsible for 48% of dropouts" : "reliability below 80%", icon: UserX, tone: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">{k.label}<k.icon className="h-4 w-4" /></div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{k.value}</div>
            <div className={cn("mt-1 text-xs", k.tone ?? "text-muted-foreground")}>{k.sub}</div>
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
              {trend.filter((d) => d.event).map((d) => <ReferenceDot key={d.day} x={d.day} y={d.dropouts} r={4} fill="var(--destructive)" stroke="none" />)}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Day-of-Week Distribution" sub="Monday & Friday peaks">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dow}>
              <XAxis dataKey="day" {...axis} /><YAxis {...axis} width={28} />
              <Tooltip {...tip} />
              <Bar dataKey="dropouts" radius={[6, 6, 0, 0]}>
                {dow.map((d) => <Cell key={d.day} fill={d.dropouts >= maxDow * 0.85 ? "var(--destructive)" : "var(--chart-2)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {dow.map((d) => (
              <div key={d.day} className="rounded py-1.5 text-center text-[10px] font-medium" style={{ background: `color-mix(in oklab, var(--destructive) ${Math.round((d.dropouts / maxDow) * 80)}%, var(--muted))` }}>{d.day}</div>
            ))}
          </div>
        </Card>

        <Card title="Top High-Risk Cooks" sub="Ranked by 30-day dropouts" className="lg:col-span-2" icon={Trophy}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>{["#", "Cook", "City", "Specialty", "Dropouts", "Disrupted ₹", "Reliability", "Action"].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {risk.map((r, i) => {
                  const level = r.reliability < 80 ? ["Critical Risk", "bg-destructive/15 text-destructive"] : r.reliability < 88 ? ["Moderate Risk", "bg-warning/15 text-warning"] : ["Low Risk", "bg-success/15 text-success"];
                  const act = r.action === "Offboard" ? "border-destructive/40 text-destructive" : r.action === "Cap Daily Orders" ? "border-warning/40 text-warning" : "border-border text-muted-foreground";
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-2"><div className="font-medium">{r.name}</div><div className="font-mono text-[10px] text-muted-foreground">{r.id}</div></td>
                      <td className="px-2 py-2">{r.city}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.specialty}</td>
                      <td className="px-2 py-2 tabular-nums">{r.dropouts}</td>
                      <td className="px-2 py-2 tabular-nums">₹{r.revenue.toLocaleString("en-IN")}</td>
                      <td className="px-2 py-2"><span className={cn("whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium", level[1])}>{r.reliability}% · {level[0]}</span></td>
                      <td className="px-2 py-2"><span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px]", act)}><ShieldAlert className="h-3 w-3" />{r.action}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, sub, children, className, icon: I }: { title: string; sub: string; children: React.ReactNode; className?: string; icon?: typeof Trophy }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">{I && <I className="h-4 w-4 text-primary" />}{title}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{sub}</p>
      {children}
    </section>
  );
}
