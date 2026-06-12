// Mock data for investor dashboard (interface only — no real financial logic)
export const portfolio = {
  totalValue: 248_750,
  totalShares: 1_245,
  pendingInvestments: 12_500,
  availableBalance: 18_320,
  growthPct: 14.8,
  ytdReturn: 22.4,
};

export const allocation = [
  { name: "SpaceX", value: 145_000, color: "#3b82f6" },
  { name: "Tesla", value: 58_000, color: "#ef4444" },
  { name: "Starlink", value: 32_500, color: "#a855f7" },
  { name: "Cash", value: 13_250, color: "#22c55e" },
];

export const growthSeries = [
  { m: "Jan", v: 180000 },
  { m: "Feb", v: 188000 },
  { m: "Mar", v: 195000 },
  { m: "Apr", v: 192000 },
  { m: "May", v: 205000 },
  { m: "Jun", v: 218000 },
  { m: "Jul", v: 226000 },
  { m: "Aug", v: 232000 },
  { m: "Sep", v: 240000 },
  { m: "Oct", v: 248750 },
];

export const investments = [
  { id: "spx-001", name: "SpaceX Pre-IPO Shares", units: 850, value: 145000, purchaseDate: "2024-03-12", status: "Active", performance: 18.4, asset: "spacex" },
  { id: "tsla-002", name: "Tesla Inc. (TSLA)", units: 240, value: 58000, purchaseDate: "2024-06-04", status: "Active", performance: 9.2, asset: "tesla" },
  { id: "stl-003", name: "Starlink Investor Package — Tier II", units: 12, value: 32500, purchaseDate: "2025-01-21", status: "Active", performance: 6.7, asset: "starlink" },
  { id: "spx-pre-004", name: "SpaceX Series N Allocation", units: 143, value: 12500, purchaseDate: "2026-02-10", status: "Pending", performance: 0, asset: "spacex" },
];

export const opportunities = [
  { id: "op-1", name: "SpaceX Series N — Late Stage", minTicket: 25000, target: "Pre-IPO", closes: "2026-08-15", tag: "Featured" },
  { id: "op-2", name: "Starlink Infrastructure Bond II", minTicket: 5000, target: "8.4% APY", closes: "2026-07-02", tag: "Income" },
  { id: "op-3", name: "Tesla Optimus Robotics Fund", minTicket: 10000, target: "Growth", closes: "2026-09-30", tag: "New" },
  { id: "op-4", name: "Starbase Real Estate Trust", minTicket: 15000, target: "Real Assets", closes: "2026-10-12", tag: "Stable" },
];

export const transactions = [
  { id: "tx-9821", type: "Deposit", amount: 25000, currency: "USD", method: "Bank Wire", date: "2026-06-09 14:22", status: "Completed" },
  { id: "tx-9820", type: "Investment", amount: -12500, currency: "USD", method: "SpaceX Series N", date: "2026-06-08 09:14", status: "Pending" },
  { id: "tx-9810", type: "Dividend", amount: 412.55, currency: "USD", method: "Starlink Tier II", date: "2026-06-01 00:00", status: "Completed" },
  { id: "tx-9755", type: "Investment", amount: -32500, currency: "USD", method: "Starlink Package", date: "2025-01-21 11:08", status: "Completed" },
  { id: "tx-9701", type: "Withdrawal", amount: -5000, currency: "USD", method: "Bank Wire", date: "2025-01-10 16:40", status: "Completed" },
  { id: "tx-9600", type: "Deposit", amount: 60000, currency: "USD", method: "Crypto (USDC)", date: "2024-12-22 18:12", status: "Completed" },
];

export const documents = [
  { id: "d-1", name: "Q4 2025 Portfolio Statement.pdf", category: "Statements", date: "2026-01-05", size: "412 KB" },
  { id: "d-2", name: "SpaceX Series N Subscription Agreement.pdf", category: "Contracts", date: "2026-02-10", size: "1.2 MB" },
  { id: "d-3", name: "Tax Form 1099-DIV (2025).pdf", category: "Tax", date: "2026-02-28", size: "188 KB" },
  { id: "d-4", name: "Passport (Verified).pdf", category: "Verification", date: "2024-03-01", size: "2.1 MB" },
  { id: "d-5", name: "Proof of Address — Utility Bill.pdf", category: "Verification", date: "2024-03-01", size: "560 KB" },
];

export const notifications = [
  { id: "n-1", kind: "investment", title: "SpaceX Series N allocation confirmed", body: "Your allocation of 143 units is pending settlement.", time: "2h ago", unread: true },
  { id: "n-2", kind: "security", title: "New device sign-in detected", body: "Sign-in from Chrome on macOS, San Francisco.", time: "1d ago", unread: true },
  { id: "n-3", kind: "system", title: "Tax documents are ready", body: "Your 2025 1099 forms are available in the Document Vault.", time: "3d ago", unread: false },
  { id: "n-4", kind: "verification", title: "KYC verified", body: "Your identity has been fully verified. Tier 2 limits unlocked.", time: "2w ago", unread: false },
];

export const referrals = {
  code: "SPX-AX9F2K",
  link: "https://spacex-ipo.exchange/r/SPX-AX9F2K",
  totalReferred: 14,
  qualifiedInvestors: 6,
  totalEarnings: 4820,
  pendingEarnings: 1100,
  history: [
    { id: "r-1", name: "M. Reeves", date: "2026-05-22", status: "Qualified", earned: 1200 },
    { id: "r-2", name: "Anonymous", date: "2026-05-08", status: "Pending", earned: 0 },
    { id: "r-3", name: "S. Okafor", date: "2026-04-30", status: "Qualified", earned: 800 },
    { id: "r-4", name: "K. Tanaka", date: "2026-04-12", status: "Qualified", earned: 1820 },
  ],
  leaderboard: [
    { rank: 1, handle: "Orbital_Capital", earned: 84200 },
    { rank: 2, handle: "Falcon_Ventures", earned: 51000 },
    { rank: 3, handle: "Stellar_Wealth", earned: 32400 },
    { rank: 4, handle: "You", earned: 4820, you: true },
    { rank: 5, handle: "Apogee_Asset", earned: 3100 },
  ],
};

export const tickets = [
  { id: "T-2042", subject: "Wire confirmation timing", priority: "Normal", status: "Open", updated: "1h ago" },
  { id: "T-2031", subject: "Allocation question — Series N", priority: "High", status: "In Progress", updated: "1d ago" },
  { id: "T-1988", subject: "Update bank beneficiary name", priority: "Normal", status: "Resolved", updated: "1w ago" },
];

export const news = [
  { id: "nw-1", title: "SpaceX completes 250th Starship flight", time: "Today" },
  { id: "nw-2", title: "Starlink hits 12 million subscribers globally", time: "Yesterday" },
  { id: "nw-3", title: "Tesla unveils Optimus Gen 4 production line", time: "3 days ago" },
];

export const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const fmtUSDc = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
