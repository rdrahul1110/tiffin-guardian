# Tiffin Guardian

Build a high-polish, production-grade web application called "TiffinLoop" — a meal subscription marketplace connecting home cooks with working professionals across Bengaluru, Mumbai, and Pune.

### Context & Real-Time Anchor:
- Simulated Current Time: 10:30 AM, Wednesday, 23 September 2026.
- Lunch Delivery: 12:30 PM (Urgent countdown: ~2 hours remaining!).
- Dinner Delivery: 7:30 PM.
- The company currently runs on WhatsApp, phone calls, and manual spreadsheets. We need an automated tool to handle unexpected cook dropouts and an executive view for leadership.

### Global Header & Navigation:
- Top Navbar: TiffinLoop Logo, Live Simulated Clock badge ("23 Sep 2026, 10:30 AM"), City Filter (All, Bengaluru, Mumbai, Pune).
- Clean Tab Switcher:
  1. "🚨 Ops Command Center" (For ops managers resolving today's dropouts)
  2. "📊 Leadership Analytics" (For leadership spotting 30-day failure patterns)

---

### View 1: Ops Command Center (Crisis Resolution)

1. Morning WhatsApp Incident Ticker (Top Banner):
   - Highlight 3 detected morning leave requests parsed from the ops WhatsApp chat:
     * 🔴 Lakshmi Iyer (CK086) - Bengaluru (Fever, 9 affected orders) - [Sheet Status: On Leave]
     * 🔴 Geeta Rao (CK087) - Bengaluru (Family function, 9 affected orders) - [Sheet Status: On Leave]
     * ⚠️ Sunita Kulkarni (CK090) - Mumbai (Urgent village trip, 6 affected orders) - [Sheet Status: Still Active - Unactioned Chat Alert!]
   - Clicking any of these alert cards immediately loads that cook into the resolution view.

2. Cook Dropout Selector & Summary:
   - Searchable Cook Dropdown to select any cook or enter a custom cook ID.
   - Cook Profile Card: Cook Name, City, Cuisine Specialty, Serves (Veg, Jain, Non-Veg), Today's Scheduled Meals count.
   - Prominent Button: "Declare Dropout & Find Solutions".

3. Affected Subscribers Panel:
   - Displays all impacted customer orders for today split by Lunch (12:30 PM) and Dinner (7:30 PM).
   - Table columns: Order ID, Subscriber Name, Phone, Meal Type, Cuisine Preference, Strict Diet Badge (Green for Veg, Orange for Jain, Red for Non-Veg), Amount (₹), Resolution Status (Unresolved, Reassigned, Refunded).

4. Smart Backup Allocation Engine (with Capacity Conflict Handling):
   - Algorithm section showing eligible backup cooks in the same city matching the subscriber's diet strictly (e.g., a Jain customer can only go to a cook who explicitly serves Jain).
   - Capacity Meter on each backup cook: e.g. "CK003 Ayesha Gupta — Remaining Capacity: 12/40 slots" vs "CK001 Neha Agarwal — Capacity: 3 slots".
   - Handles Capacity Conflicts: If Backup Cook A only has 4 slots left but 6 orders need fulfillment, visually show a split (4 assigned to Cook A, 2 routed to Cook B or marked for Refund).
   - 1-Click Action: "Auto-Allocate Backups & Preview Messages".

5. Subscriber Communication Modal / Drawer (Simulated WhatsApp & SMS):
   - Interactive preview of personalized customer notifications before sending:
     * Reassignment Message: "Hi Chetan, your cook Geeta Rao is unwell today. We have reassigned your Jain South Indian lunch to Ayesha Gupta. Delivered on time by 1:00 PM. 🍱"
     * Refund Message (if no backup available): "Hi Harish, your cook is unavailable today and nearby kitchens are at full capacity. We have initiated a full refund of ₹179 to your UPI + added a ₹50 credit. 🙏"
   - Button: "Send All Notifications (Simulated)" with a success confetti animation and status changing to "Sent".

6. Traceability Audit Log:
   - Chronological table showing past decisions: Timestamp, Dropped Cook, Subscribers Affected, Reassigned Cook, Refunds Issued, Ops Operator, Status.

---

### View 2: Leadership Analytics Dashboard (30-Day Executive View)

1. Executive Metric KPI Cards:
   - Total Orders (Last 30 Days): 7,138
   - Total Cook Dropouts: 134 meals disrupted (1.9% failure rate)
   - Financial Impact: ₹21,480 refunded due to cook no-shows
   - High-Risk Repeat Cooks: 4 cooks responsible for 48% of dropouts

2. Visual Analytics (using clean Recharts charts):
   - Chart 1: Cook Dropout Frequency by City (Bar Chart comparing Bengaluru vs Mumbai vs Pune).
   - Chart 2: 30-Day Disruption Trend (Line chart showing meal dropouts day-by-day with weekend/festival spikes).
   - Chart 3: Day-of-Week Dropout Distribution (Heatmap or Bar chart showing Monday & Friday peaks).

3. Top 10 High-Risk Cooks Leaderboard:
   - Table: Cook Name, City, Specialty, Total Dropouts (30d), Disrupted Revenue (₹), Reliability Score badge (e.g., 72% - Critical Risk, 85% - Moderate Risk), Recommended Action (e.g., "Schedule Coaching", "Cap Daily Orders", "Offboard").

---

### Styling & Polish:
- Tailwind CSS with a clean, professional, enterprise-grade look (similar to Linear or Stripe dashboards).
- Dark/Light mode support or modern slate background with high-contrast text.
- Use Lucide-react icons for all statuses, alerts, meals, and actions.
- Include realistic sample data for 10 cooks, 15 subscribers, and 30-day stats so it works interactively right out of the box.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2d1670ac-ab50-4866-b7bc-28438b54e816).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
