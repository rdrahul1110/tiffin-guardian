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
  booked: number; // already committed today (before backups)
  phone: string;
}

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  city: City;
  diet: Diet;
  cuisine: string;
}

export interface Order {
  id: string;
  subscriberId: string;
  cookId: string;
  meal: Meal;
  amount: number;
}

export const COOKS: Cook[] = [
  { id: "CK001", name: "Neha Agarwal", city: "Bengaluru", specialty: "North Indian Thali", serves: ["Veg", "Jain"], capacity: 30, booked: 27, phone: "+91 98450 11201" },
  { id: "CK003", name: "Ayesha Gupta", city: "Bengaluru", specialty: "South Indian & Mughlai", serves: ["Veg", "Jain", "Non-Veg"], capacity: 40, booked: 28, phone: "+91 98450 11203" },
  { id: "CK005", name: "Ravi Menon", city: "Bengaluru", specialty: "Kerala Home Style", serves: ["Veg", "Non-Veg"], capacity: 25, booked: 19, phone: "+91 98450 11205" },
  { id: "CK086", name: "Lakshmi Iyer", city: "Bengaluru", specialty: "Tamil Brahmin Meals", serves: ["Veg", "Jain"], capacity: 20, booked: 9, phone: "+91 98450 11286" },
  { id: "CK087", name: "Geeta Rao", city: "Bengaluru", specialty: "Udupi South Indian", serves: ["Veg", "Jain", "Non-Veg"], capacity: 20, booked: 9, phone: "+91 98450 11287" },
  { id: "CK090", name: "Sunita Kulkarni", city: "Mumbai", specialty: "Maharashtrian Gharguti", serves: ["Veg", "Jain", "Non-Veg"], capacity: 18, booked: 6, phone: "+91 98200 22390" },
  { id: "CK012", name: "Farah Shaikh", city: "Mumbai", specialty: "Mughlai & Bohri", serves: ["Veg", "Non-Veg"], capacity: 30, booked: 27, phone: "+91 98200 22312" },
  { id: "CK014", name: "Meena Shah", city: "Mumbai", specialty: "Gujarati Jain Thali", serves: ["Veg", "Jain"], capacity: 20, booked: 19, phone: "+91 98200 22314" },
  { id: "CK021", name: "Priya Deshpande", city: "Pune", specialty: "Puneri Maharashtrian", serves: ["Veg", "Jain"], capacity: 30, booked: 20, phone: "+91 98220 33421" },
  { id: "CK023", name: "Anjali Joshi", city: "Pune", specialty: "Punjabi Home Kitchen", serves: ["Veg", "Non-Veg"], capacity: 25, booked: 17, phone: "+91 98220 33423" },
];

export const SUBSCRIBERS: Subscriber[] = [
  { id: "S01", name: "Chetan Bhat", phone: "+91 99001 45012", city: "Bengaluru", diet: "Jain", cuisine: "South Indian" },
  { id: "S02", name: "Arjun Nair", phone: "+91 99001 45013", city: "Bengaluru", diet: "Veg", cuisine: "South Indian" },
  { id: "S03", name: "Divya Krishnan", phone: "+91 99001 45014", city: "Bengaluru", diet: "Veg", cuisine: "Tamil" },
  { id: "S04", name: "Rohit Jain", phone: "+91 99001 45015", city: "Bengaluru", diet: "Jain", cuisine: "North Indian" },
  { id: "S05", name: "Sneha Reddy", phone: "+91 99001 45016", city: "Bengaluru", diet: "Non-Veg", cuisine: "Andhra" },
  { id: "S06", name: "Karthik Subramanian", phone: "+91 99001 45017", city: "Bengaluru", diet: "Veg", cuisine: "South Indian" },
  { id: "S07", name: "Pooja Hegde", phone: "+91 99001 45018", city: "Bengaluru", diet: "Non-Veg", cuisine: "Mangalorean" },
  { id: "S08", name: "Vikram Rao", phone: "+91 99001 45019", city: "Bengaluru", diet: "Veg", cuisine: "Udupi" },
  { id: "S09", name: "Harish Mehta", phone: "+91 98670 51020", city: "Mumbai", diet: "Jain", cuisine: "Gujarati" },
  { id: "S10", name: "Nikita Patil", phone: "+91 98670 51021", city: "Mumbai", diet: "Veg", cuisine: "Maharashtrian" },
  { id: "S11", name: "Imran Qureshi", phone: "+91 98670 51022", city: "Mumbai", diet: "Non-Veg", cuisine: "Mughlai" },
  { id: "S12", name: "Riya Doshi", phone: "+91 98670 51023", city: "Mumbai", diet: "Jain", cuisine: "Gujarati" },
  { id: "S13", name: "Aditya Kale", phone: "+91 98220 61024", city: "Pune", diet: "Veg", cuisine: "Maharashtrian" },
  { id: "S14", name: "Sana Khan", phone: "+91 98220 61025", city: "Pune", diet: "Non-Veg", cuisine: "Punjabi" },
  { id: "S15", name: "Tanvi Gokhale", phone: "+91 98220 61026", city: "Pune", diet: "Jain", cuisine: "Maharashtrian" },
];

const O = (id: string, s: string, c: string, meal: Meal, amount: number): Order => ({ id, subscriberId: s, cookId: c, meal, amount });

export const ORDERS: Order[] = [
  // CK086 Lakshmi Iyer — 9
  O("TL-24101", "S02", "CK086", "Lunch", 159), O("TL-24102", "S03", "CK086", "Lunch", 169),
  O("TL-24103", "S04", "CK086", "Lunch", 179), O("TL-24104", "S06", "CK086", "Lunch", 159),
  O("TL-24105", "S08", "CK086", "Lunch", 149), O("TL-24106", "S02", "CK086", "Dinner", 159),
  O("TL-24107", "S03", "CK086", "Dinner", 169), O("TL-24108", "S04", "CK086", "Dinner", 179),
  O("TL-24109", "S06", "CK086", "Dinner", 159),
  // CK087 Geeta Rao — 9
  O("TL-24110", "S01", "CK087", "Lunch", 179), O("TL-24111", "S05", "CK087", "Lunch", 199),
  O("TL-24112", "S07", "CK087", "Lunch", 199), O("TL-24113", "S08", "CK087", "Lunch", 149),
  O("TL-24114", "S01", "CK087", "Dinner", 179), O("TL-24115", "S05", "CK087", "Dinner", 199),
  O("TL-24116", "S07", "CK087", "Dinner", 199), O("TL-24117", "S02", "CK087", "Dinner", 159),
  O("TL-24118", "S03", "CK087", "Dinner", 169),
  // CK090 Sunita Kulkarni — 6
  O("TL-24119", "S09", "CK090", "Lunch", 179), O("TL-24120", "S10", "CK090", "Lunch", 149),
  O("TL-24121", "S12", "CK090", "Lunch", 179), O("TL-24122", "S11", "CK090", "Dinner", 199),
  O("TL-24123", "S09", "CK090", "Dinner", 179), O("TL-24124", "S12", "CK090", "Dinner", 179),
  // Other cooks
  O("TL-24125", "S13", "CK021", "Lunch", 149), O("TL-24126", "S15", "CK021", "Dinner", 169),
  O("TL-24127", "S14", "CK023", "Lunch", 189), O("TL-24128", "S11", "CK012", "Lunch", 199),
  O("TL-24129", "S10", "CK014", "Dinner", 149), O("TL-24130", "S05", "CK003", "Lunch", 199),
  O("TL-24131", "S04", "CK001", "Lunch", 179), O("TL-24132", "S07", "CK005", "Dinner", 199),
];

export interface Incident {
  cookId: string;
  reason: string;
  reasonPhrase: string;
  sheetStatus: "On Leave" | "Still Active";
  receivedAt: string;
  message: string;
}

export const INCIDENTS: Incident[] = [
  { cookId: "CK086", reason: "Fever", reasonPhrase: "unwell", sheetStatus: "On Leave", receivedAt: "07:42 AM", message: "Madam, I have high fever since night. Cannot cook today 🙏" },
  { cookId: "CK087", reason: "Family function", reasonPhrase: "attending a family function", sheetStatus: "On Leave", receivedAt: "08:15 AM", message: "Sorry, sudden family function in Mangalore. Leave today pls." },
  { cookId: "CK090", reason: "Urgent village trip", reasonPhrase: "travelling urgently", sheetStatus: "Still Active", receivedAt: "09:58 AM", message: "Urgent — going to village, train at 11. No tiffin today." },
];

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

export const INITIAL_AUDIT: AuditEntry[] = [
  { id: "A-1042", timestamp: "22 Sep, 06:10 PM", droppedCook: "Farah Shaikh (CK012)", affected: 7, reassignedTo: "CK090 Sunita Kulkarni", refunds: 1, operator: "Priya S.", status: "Completed" },
  { id: "A-1041", timestamp: "22 Sep, 10:05 AM", droppedCook: "Anjali Joshi (CK023)", affected: 5, reassignedTo: "—", refunds: 5, operator: "Rahul D.", status: "Partial" },
  { id: "A-1040", timestamp: "21 Sep, 11:20 AM", droppedCook: "Ravi Menon (CK005)", affected: 8, reassignedTo: "CK003 Ayesha Gupta", refunds: 0, operator: "Priya S.", status: "Completed" },
  { id: "A-1039", timestamp: "19 Sep, 09:45 AM", droppedCook: "Lakshmi Iyer (CK086)", affected: 9, reassignedTo: "CK001, CK003", refunds: 0, operator: "Arvind K.", status: "Completed" },
];

// ---------- Analytics ----------
export const CITY_STATS: Record<City, { orders: number; dropouts: number; refunded: number }> = {
  Bengaluru: { orders: 3120, dropouts: 61, refunded: 9780 },
  Mumbai: { orders: 2510, dropouts: 47, refunded: 7520 },
  Pune: { orders: 1508, dropouts: 26, refunded: 4180 },
};

const TREND = [3, 5, 4, 3, 4, 8, 5, 3, 4, 3, 4, 4, 9, 7, 3, 4, 4, 3, 5, 6, 8, 3, 4, 3, 4, 3, 6, 4, 3, 5];
const FESTIVALS: Record<number, string> = { 12: "Ganesh Chaturthi", 13: "Ganesh Chaturthi", 5: "Weekend", 20: "Weekend" };
export const TREND_DATA = TREND.map((v, i) => {
  const d = new Date(2026, 7, 25 + i);
  return {
    day: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    dropouts: v,
    event: FESTIVALS[i] ?? "",
  };
});

export const DOW_DATA = [
  { day: "Mon", dropouts: 29 }, { day: "Tue", dropouts: 15 }, { day: "Wed", dropouts: 14 },
  { day: "Thu", dropouts: 16 }, { day: "Fri", dropouts: 31 }, { day: "Sat", dropouts: 17 }, { day: "Sun", dropouts: 12 },
];

export interface RiskCook { name: string; id: string; city: City; specialty: string; dropouts: number; revenue: number; reliability: number; action: string }
export const RISK_COOKS: RiskCook[] = [
  { name: "Lakshmi Iyer", id: "CK086", city: "Bengaluru", specialty: "Tamil Brahmin Meals", dropouts: 19, revenue: 3040, reliability: 68, action: "Offboard" },
  { name: "Sunita Kulkarni", id: "CK090", city: "Mumbai", specialty: "Maharashtrian", dropouts: 17, revenue: 2790, reliability: 71, action: "Offboard" },
  { name: "Geeta Rao", id: "CK087", city: "Bengaluru", specialty: "Udupi South Indian", dropouts: 15, revenue: 2460, reliability: 72, action: "Cap Daily Orders" },
  { name: "Anjali Joshi", id: "CK023", city: "Pune", specialty: "Punjabi", dropouts: 13, revenue: 2150, reliability: 76, action: "Cap Daily Orders" },
  { name: "Farah Shaikh", id: "CK012", city: "Mumbai", specialty: "Mughlai & Bohri", dropouts: 9, revenue: 1620, reliability: 81, action: "Schedule Coaching" },
  { name: "Ravi Menon", id: "CK005", city: "Bengaluru", specialty: "Kerala Home Style", dropouts: 8, revenue: 1390, reliability: 84, action: "Schedule Coaching" },
  { name: "Deepa Pillai", id: "CK041", city: "Bengaluru", specialty: "Chettinad", dropouts: 7, revenue: 1180, reliability: 85, action: "Schedule Coaching" },
  { name: "Meena Shah", id: "CK014", city: "Mumbai", specialty: "Gujarati Jain Thali", dropouts: 6, revenue: 960, reliability: 88, action: "Monitor" },
  { name: "Kavita Pawar", id: "CK027", city: "Pune", specialty: "Kolhapuri", dropouts: 5, revenue: 840, reliability: 90, action: "Monitor" },
  { name: "Neha Agarwal", id: "CK001", city: "Bengaluru", specialty: "North Indian Thali", dropouts: 4, revenue: 690, reliability: 92, action: "Monitor" },
];

// ---------- Allocation engine ----------
export interface Allocation {
  orderId: string;
  backupCookId: string | null; // null => refund
  reason: string;
}

export function remaining(cook: Cook, extra: Record<string, number>) {
  return cook.capacity - cook.booked - (extra[cook.id] ?? 0);
}

export function eligibleBackups(dropped: Cook, diet: Diet, extra: Record<string, number>) {
  return COOKS.filter((c) => c.id !== dropped.id && c.city === dropped.city && c.serves.includes(diet) && !INCIDENTS.some((i) => i.cookId === c.id))
    .sort((a, b) => remaining(b, extra) - remaining(a, extra));
}

export function allocate(dropped: Cook, orders: Order[], extra: Record<string, number>) {
  const used: Record<string, number> = { ...extra };
  // Strictest diets first (Jain has fewest eligible cooks)
  const rank: Record<Diet, number> = { Jain: 0, "Non-Veg": 1, Veg: 2 };
  const sorted = [...orders].sort((a, b) => rank[sub(a).diet] - rank[sub(b).diet]);
  const result: Allocation[] = [];
  for (const o of sorted) {
    const s = sub(o);
    const pool = eligibleBackups(dropped, s.diet, used).filter((c) => remaining(c, used) > 0);
    if (pool.length) {
      const c = pool[0]!;
      used[c.id] = (used[c.id] ?? 0) + 1;
      result.push({ orderId: o.id, backupCookId: c.id, reason: `${s.diet} match · ${dropped.city}` });
    } else {
      result.push({ orderId: o.id, backupCookId: null, reason: `No ${s.diet} capacity in ${dropped.city}` });
    }
  }
  return { result, used };
}

export const sub = (o: Order) => SUBSCRIBERS.find((s) => s.id === o.subscriberId)!;
export const cookById = (id: string) => COOKS.find((c) => c.id === id);
