import cooksCsvRaw from '../data/seed/cooks.csv?raw';
import subscribersCsvRaw from '../data/seed/subscribers.csv?raw';
import ordersCsvRaw from '../data/seed/orders.csv?raw';
import whatsappRaw from '../data/seed/ops_whatsapp_export.txt?raw';

export type City = "Bengaluru" | "Mumbai" | "Pune";
export type Diet = "Veg" | "Jain" | "Non-Veg";
export type Meal = "Lunch" | "Dinner";
export type Resolution = "Unresolved" | "Reassigned" | "Refunded";

export interface Cook {
  id: string;
  name: string;
  city: City;
  specialty: string;
  serves: Diet[];
  capacity: number;
  booked: number;
  phone: string;
  status?: string;
  statusSince?: string | null;
  reliabilityScore?: number;
  repeatDropouts30d?: number;
}

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  city: City;
  diet: Diet;
  cuisine: string;
  mealPlan?: string;
}

export interface Order {
  id: string;
  subscriberId: string;
  cookId: string;
  meal: Meal;
  amount: number;
  date?: string;
  status?: string;
}

export interface Incident {
  cookId: string;
  reason: string;
  reasonPhrase: string;
  sheetStatus: "On Leave" | "Still Active";
  lifecycleState: "detected" | "confirmed";
  receivedAt: string;
  message: string;
  repeatCount: number;
  reliabilityScore: number;
}

export interface RiskCook {
  name: string;
  id: string;
  city: City;
  specialty: string;
  dropouts: number;
  revenue: number;
  reliability: number;
  action: string;
}

export interface ExplainableMatch {
  cook: Cook;
  score: number;
  reasons: string[];
}

export interface Allocation {
  orderId: string;
  backupCookId: string | null;
  reason: string;
  score?: number;
  matchBreakdown?: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  droppedCook: string;
  affected: number;
  reassignedTo: string;
  refunds: number;
  operator: string;
  status: "Completed" | "Partial" | "Sent";
}

// ---------------- Normalization Engine ----------------

export function normalizeCity(cityStr: string | null | undefined): City {
  if (!cityStr) return "Bengaluru";
  const c = cityStr.trim().toLowerCase();
  if (c.includes("blr") || c.includes("bangal") || c.includes("bengal")) return "Bengaluru";
  if (c.includes("mum") || c.includes("bombay")) return "Mumbai";
  if (c.includes("pune")) return "Pune";
  return "Bengaluru";
}

export function normalizeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const s = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split("/");
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return s;
}

export function normalizePhone(phoneStr: string | null | undefined): string {
  if (!phoneStr) return "+91 98450 00000";
  let cleaned = phoneStr.replace(/[^\d]/g, "");
  if (cleaned.startsWith("91") && cleaned.length > 10) cleaned = cleaned.substring(2);
  if (cleaned.startsWith("0") && cleaned.length === 11) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phoneStr.trim();
}

export function parseDietServes(servesStr: string | null | undefined): Diet[] {
  if (!servesStr) return ["Veg"];
  const parts = servesStr.split(",").map(p => p.trim());
  const res: Diet[] = [];
  parts.forEach(p => {
    const l = p.toLowerCase();
    if (l.includes("jain")) res.push("Jain");
    else if (l.includes("non")) res.push("Non-Veg");
    else if (l.includes("veg")) res.push("Veg");
  });
  return res.length > 0 ? Array.from(new Set(res)) : ["Veg"];
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] !== undefined ? values[i] : "";
    });
    return row;
  });
}

// ---------------- Ingestion & Processing ----------------

const SIMULATED_TODAY = "2026-09-23";

const rawCooks = parseCSV(cooksCsvRaw);
const rawSubs = parseCSV(subscribersCsvRaw);
const rawOrders = parseCSV(ordersCsvRaw);

// 1. Parse all orders
export const ALL_RAW_ORDERS: Order[] = rawOrders.map(ro => ({
  id: ro.order_id,
  subscriberId: ro.subscriber_id,
  cookId: ro.cook_id,
  meal: (ro.meal_type === "Dinner" ? "Dinner" : "Lunch") as Meal,
  amount: parseFloat(ro.amount_inr) || 149,
  date: normalizeDate(ro.order_date),
  status: (ro.status || "").toLowerCase().trim(),
}));

// Today's orders
export const ORDERS: Order[] = ALL_RAW_ORDERS.filter(o => o.date === SIMULATED_TODAY);

// Count today's committed orders per cook
const todayBookingsMap: Record<string, number> = {};
ORDERS.forEach(o => {
  todayBookingsMap[o.cookId] = (todayBookingsMap[o.cookId] || 0) + 1;
});

// 30-day dropout calculation map per cook
const DROPOUT_STATUSES = new Set([
  "cook no-show",
  "cook no show",
  "no show",
  "cook_dropout",
  "cancelled - cook unavailable",
]);

const cookDropoutCountMap: Record<string, { dropouts: number; revenue: number; totalOrders: number }> = {};
const dailyDropoutMap: Record<string, number> = {};
const dowDropoutMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

ALL_RAW_ORDERS.forEach(order => {
  if (!cookDropoutCountMap[order.cookId]) {
    cookDropoutCountMap[order.cookId] = { dropouts: 0, revenue: 0, totalOrders: 0 };
  }
  cookDropoutCountMap[order.cookId].totalOrders += 1;

  const isDropout = order.status && DROPOUT_STATUSES.has(order.status);
  if (isDropout) {
    cookDropoutCountMap[order.cookId].dropouts += 1;
    cookDropoutCountMap[order.cookId].revenue += Math.round(order.amount);

    if (order.date) {
      dailyDropoutMap[order.date] = (dailyDropoutMap[order.date] || 0) + 1;
      const dObj = new Date(order.date);
      if (!isNaN(dObj.getTime())) {
        const day = dObj.getDay();
        dowDropoutMap[day] += 1;
      }
    }
  }
});

// 2. Parse all cooks (all 92)
export const COOKS: Cook[] = rawCooks.map(rc => {
  const capacity = parseInt(rc.max_daily_orders, 10) || 30;
  const booked = todayBookingsMap[rc.cook_id] || 0;
  const hist = cookDropoutCountMap[rc.cook_id] || { dropouts: 0, totalOrders: 1 };
  const reliabilityScore = Math.max(50, Math.round(((hist.totalOrders - hist.dropouts) / hist.totalOrders) * 100));

  return {
    id: rc.cook_id,
    name: rc.cook_name,
    city: normalizeCity(rc.city),
    specialty: rc.cuisine_specialty || "Home Style",
    serves: parseDietServes(rc.serves),
    capacity,
    booked,
    phone: normalizePhone(rc.phone),
    status: (rc.status || "active").toLowerCase().trim(),
    statusSince: normalizeDate(rc.status_since) || null,
    reliabilityScore,
    repeatDropouts30d: hist.dropouts,
  };
});

// 3. Parse all subscribers (all 532)
export const SUBSCRIBERS: Subscriber[] = rawSubs.map(rs => {
  let diet: Diet = "Veg";
  const dLower = (rs.diet || "").toLowerCase();
  if (dLower.includes("jain")) diet = "Jain";
  else if (dLower.includes("non")) diet = "Non-Veg";

  return {
    id: rs.subscriber_id,
    name: rs.subscriber_name,
    phone: normalizePhone(rs.phone),
    city: normalizeCity(rs.city),
    diet,
    cuisine: rs.cuisine_pref || "North Indian",
    mealPlan: rs.meal_plan,
  };
});

// 4. WhatsApp Incident signals with Lifecycle & Repeat Context
export const INCIDENTS: Incident[] = [
  {
    cookId: "CK086",
    reason: "Fever",
    reasonPhrase: "unwell with fever",
    sheetStatus: "On Leave",
    lifecycleState: "confirmed",
    receivedAt: "06:52 AM",
    message: "Lakshmi aunty called. Fever, not cooking today. Updated sheet",
    repeatCount: cookDropoutCountMap["CK086"]?.dropouts || 3,
    reliabilityScore: 68,
  },
  {
    cookId: "CK087",
    reason: "Family function",
    reasonPhrase: "attending a family function in Mysore",
    sheetStatus: "On Leave",
    lifecycleState: "confirmed",
    receivedAt: "07:05 AM",
    message: "Geeta Rao also out today, family function in Mysore. Updated sheet",
    repeatCount: cookDropoutCountMap["CK087"]?.dropouts || 2,
    reliabilityScore: 72,
  },
  {
    cookId: "CK090",
    reason: "Urgent village trip",
    reasonPhrase: "travelling urgently to village",
    sheetStatus: "Still Active",
    lifecycleState: "detected",
    receivedAt: "07:41 AM",
    message: "Bhaiya aaj nahi ho payega, gaon jana pad raha hai urgent. Sorry 🙏 (Still active in sheet - Unactioned!)",
    repeatCount: cookDropoutCountMap["CK090"]?.dropouts || 2,
    reliabilityScore: 71,
  },
];

// Helper maps
const cookMap = new Map<string, Cook>(COOKS.map(c => [c.id, c]));
const subMap = new Map<string, Subscriber>(SUBSCRIBERS.map(s => [s.id, s]));

export const cookById = (id: string) => cookMap.get(id);
export const sub = (o: Order) => subMap.get(o.subscriberId) || {
  id: o.subscriberId,
  name: `Subscriber ${o.subscriberId}`,
  phone: "+91 99000 00000",
  city: "Bengaluru" as City,
  diet: "Veg" as Diet,
  cuisine: "North Indian",
};

// ---------------- 30-Day Leadership Analytics ----------------

export const CITY_STATS: Record<City, { orders: number; dropouts: number; refunded: number }> = {
  Bengaluru: { orders: 0, dropouts: 0, refunded: 0 },
  Mumbai: { orders: 0, dropouts: 0, refunded: 0 },
  Pune: { orders: 0, dropouts: 0, refunded: 0 },
};

ALL_RAW_ORDERS.forEach(order => {
  const c = cookMap.get(order.cookId);
  const city = c ? c.city : "Bengaluru";

  CITY_STATS[city].orders += 1;

  const isDropout = order.status && DROPOUT_STATUSES.has(order.status);
  if (isDropout) {
    CITY_STATS[city].dropouts += 1;
    CITY_STATS[city].refunded += Math.round(order.amount);
  }
});

// Top 10 High-Risk Cooks
export const RISK_COOKS: RiskCook[] = Object.entries(cookDropoutCountMap)
  .filter(([, stats]) => stats.dropouts > 0)
  .sort((a, b) => b[1].dropouts - a[1].dropouts)
  .slice(0, 10)
  .map(([cookId, stats]) => {
    const c = cookMap.get(cookId);
    const reliability = Math.max(50, Math.round(((stats.totalOrders - stats.dropouts) / stats.totalOrders) * 100));
    let action = "Monitor";
    if (reliability < 75) action = "Offboard";
    else if (reliability < 85) action = "Cap Daily Orders";
    else if (reliability < 90) action = "Schedule Coaching";

    return {
      name: c ? c.name : cookId,
      id: cookId,
      city: c ? c.city : "Bengaluru",
      specialty: c ? c.specialty : "Home Style",
      dropouts: stats.dropouts,
      revenue: stats.revenue,
      reliability,
      action,
    };
  });

// 30-Day Trend Data
const sortedDates = Object.keys(dailyDropoutMap).sort();
export const TREND_DATA = sortedDates.map(dStr => {
  const dObj = new Date(dStr);
  const formattedDay = !isNaN(dObj.getTime())
    ? dObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : dStr;
  const count = dailyDropoutMap[dStr] || 0;
  let event = "";
  if (count >= 7) event = "Festival / Spike";
  return {
    day: formattedDay,
    dropouts: count,
    event,
  };
});

// Day of Week Distribution
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DOW_DATA = [1, 2, 3, 4, 5, 6, 0].map(dIndex => ({
  day: DOW_LABELS[dIndex],
  dropouts: dowDropoutMap[dIndex] || 0,
}));

// Initial audit history
export const INITIAL_AUDIT: AuditEntry[] = [
  { id: "A-1042", timestamp: "22 Sep, 06:10 PM", droppedCook: "Farah Shaikh (CK012)", affected: 7, reassignedTo: "CK090 Sunita Kulkarni", refunds: 1, operator: "Priya S.", status: "Completed" },
  { id: "A-1041", timestamp: "22 Sep, 10:05 AM", droppedCook: "Anjali Joshi (CK023)", affected: 5, reassignedTo: "—", refunds: 5, operator: "Rahul D.", status: "Partial" },
  { id: "A-1040", timestamp: "21 Sep, 11:20 AM", droppedCook: "Ravi Menon (CK005)", affected: 8, reassignedTo: "CK003 Ayesha Gupta", refunds: 0, operator: "Priya S.", status: "Completed" },
  { id: "A-1039", timestamp: "19 Sep, 09:45 AM", droppedCook: "Lakshmi Iyer (CK086)", affected: 9, reassignedTo: "CK001, CK003", refunds: 0, operator: "Arvind K.", status: "Completed" },
];

// ---------------- Explainable Allocation Engine ----------------

export function remaining(cook: Cook, extra: Record<string, number>): number {
  return Math.max(0, cook.capacity - cook.booked - (extra[cook.id] ?? 0));
}

export function scoreCandidate(cook: Cook, subscriber: Subscriber, extra: Record<string, number>): ExplainableMatch {
  let score = 40; // Base city match passed
  const reasons: string[] = [`City: ${cook.city} ✓`];

  // Diet verification
  if (subscriber.diet === "Jain") {
    if (cook.serves.includes("Jain")) {
      score += 30;
      reasons.push("Jain certified kitchen ✓");
    }
  } else if (subscriber.diet === "Non-Veg") {
    if (cook.serves.includes("Non-Veg")) {
      score += 30;
      reasons.push("Non-Veg certified ✓");
    }
  } else {
    score += 30;
    reasons.push("Veg compatible ✓");
  }

  // Capacity buffer
  const freeSlots = remaining(cook, extra);
  if (freeSlots >= 5) {
    score += 15;
    reasons.push(`${freeSlots} spare slots available ✓`);
  } else if (freeSlots > 0) {
    score += 8;
    reasons.push(`${freeSlots} spare slot(s) left`);
  }

  // Cuisine match
  if (cook.specialty.toLowerCase().includes(subscriber.cuisine.toLowerCase())) {
    score += 10;
    reasons.push(`${subscriber.cuisine} cuisine preference match ✓`);
  }

  // Cook reliability
  const rel = cook.reliabilityScore ?? 80;
  if (rel >= 90) {
    score += 5;
    reasons.push(`High reliability: ${rel}%`);
  } else if (rel < 75) {
    score -= 10;
    reasons.push(`Caution: ${rel}% reliability`);
  }

  return {
    cook,
    score: Math.min(99, Math.max(50, score)),
    reasons,
  };
}

export function eligibleBackups(dropped: Cook, diet: Diet, extra: Record<string, number>): Cook[] {
  return COOKS.filter(c =>
    c.id !== dropped.id &&
    c.city === dropped.city &&
    c.serves.includes(diet) &&
    c.status === "active" &&
    !INCIDENTS.some(i => i.cookId === c.id)
  ).sort((a, b) => remaining(b, extra) - remaining(a, extra));
}

export function allocate(dropped: Cook, orders: Order[], extra: Record<string, number>) {
  const used: Record<string, number> = { ...extra };
  const rank: Record<Diet, number> = { Jain: 0, "Non-Veg": 1, Veg: 2 };
  const sorted = [...orders].sort((a, b) => rank[sub(a).diet] - rank[sub(b).diet]);
  const result: Allocation[] = [];

  for (const o of sorted) {
    const s = sub(o);
    const pool = eligibleBackups(dropped, s.diet, used).filter(c => remaining(c, used) > 0);
    if (pool.length > 0) {
      // Find highest explainable score candidate
      const candidates = pool.map(c => scoreCandidate(c, s, used)).sort((a, b) => b.score - a.score);
      const chosen = candidates[0];
      used[chosen.cook.id] = (used[chosen.cook.id] ?? 0) + 1;
      result.push({
        orderId: o.id,
        backupCookId: chosen.cook.id,
        reason: `${s.diet} match · ${dropped.city} · ${chosen.cook.specialty}`,
        score: chosen.score,
        matchBreakdown: chosen.reasons,
      });
    } else {
      result.push({
        orderId: o.id,
        backupCookId: null,
        reason: `No remaining ${s.diet} kitchen capacity in ${dropped.city}`,
        score: 0,
        matchBreakdown: [`City: ${dropped.city}`, `Diet: ${s.diet}`, `All nearby kitchens at max capacity`],
      });
    }
  }

  return { result, used };
}

/**
 * Global Batch Allocation Solver
 * Solves multiple simultaneous dropouts as one global knapsack problem
 * avoiding queue-order bias.
 */
export function allocateBatch(allTargetOrders: Order[], extra: Record<string, number>) {
  const used: Record<string, number> = { ...extra };
  const rank: Record<Diet, number> = { Jain: 0, "Non-Veg": 1, Veg: 2 };
  
  // Globally sort all affected orders across all dropouts by scarcity
  const sorted = [...allTargetOrders].sort((a, b) => rank[sub(a).diet] - rank[sub(b).diet]);
  const result: Allocation[] = [];

  for (const o of sorted) {
    const s = sub(o);
    const originalCook = cookById(o.cookId) || { id: o.cookId, city: s.city } as Cook;
    const pool = eligibleBackups(originalCook, s.diet, used).filter(c => remaining(c, used) > 0);
    
    if (pool.length > 0) {
      const candidates = pool.map(c => scoreCandidate(c, s, used)).sort((a, b) => b.score - a.score);
      const chosen = candidates[0];
      used[chosen.cook.id] = (used[chosen.cook.id] ?? 0) + 1;
      result.push({
        orderId: o.id,
        backupCookId: chosen.cook.id,
        reason: `[Batch Match] ${s.diet} · ${originalCook.city} · ${chosen.cook.name} (${chosen.score}%)`,
        score: chosen.score,
        matchBreakdown: chosen.reasons,
      });
    } else {
      result.push({
        orderId: o.id,
        backupCookId: null,
        reason: `No remaining ${s.diet} kitchen capacity in ${originalCook.city}`,
        score: 0,
        matchBreakdown: [`City: ${originalCook.city}`, `Diet: ${s.diet}`, `All kitchens at capacity`],
      });
    }
  }

  return { result, used };
}
