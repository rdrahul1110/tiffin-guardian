import { Leaf, Flower2, Drumstick, CircleDashed, CheckCircle2, RotateCcw } from "lucide-react";
import type { Diet, Resolution } from "@/lib/tiffin-data";
import { cn } from "@/lib/utils";

const dietStyle: Record<Diet, string> = {
  Veg: "bg-veg/15 text-veg border-veg/30",
  Jain: "bg-jain/15 text-jain border-jain/30",
  "Non-Veg": "bg-nonveg/15 text-nonveg border-nonveg/30",
};
const dietIcon = { Veg: Leaf, Jain: Flower2, "Non-Veg": Drumstick };

export function DietBadge({ diet }: { diet: Diet }) {
  const I = dietIcon[diet];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium", dietStyle[diet])}>
      <I className="h-3 w-3" /> {diet}
    </span>
  );
}

export function StatusBadge({ status }: { status: Resolution }) {
  const map = {
    Unresolved: ["bg-muted text-muted-foreground border-border", CircleDashed],
    Reassigned: ["bg-success/15 text-success border-success/30", CheckCircle2],
    Refunded: ["bg-destructive/15 text-destructive border-destructive/30", RotateCcw],
  } as const;
  const [cls, I] = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium", cls)}>
      <I className="h-3 w-3" /> {status}
    </span>
  );
}
