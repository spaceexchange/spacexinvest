// Mock data for staff portals (Admin / Support / Employee) — interface-only.
export const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const adminKpis = {
  totalUsers: 24_812,
  activeInvestors: 8_341,
  newRegistrations: 412,
  kycPending: 187,
  kycApproved: 7_905,
  kycRejected: 248,
  totalInvestments: 4_280,
  aum: 1_482_500_000,
  walletBalances: 92_140_000,
  pendingDeposits: 3_245_000,
  pendingWithdrawals: 1_120_000,
  openTickets: 64,
  securityAlerts: 9,
};

export const adminGrowth = [
  { m: "Jan", users: 18200, aum: 1100 },
  { m: "Feb", users: 19400, aum: 1180 },
  { m: "Mar", users: 20100, aum: 1220 },
  { m: "Apr", users: 21050, aum: 1290 },
  { m: "May", users: 22300, aum: 1370 },
  { m: "Jun", users: 23100, aum: 1410 },
  { m: "Jul", users: 23950, aum: 1440 },
  { m: "Aug", users: 24812, aum: 1482 },
];

export const adminActivity = [
  { id: "a1", who: "Morgan Admin", what: "Approved KYC for user #41208", when: "2m ago", tone: "success" },
  { id: "a2", who: "System", what: "Wire deposit $250,000 — pending review", when: "8m ago", tone: "warning" },
  { id: "a3", who: "Sam Support", what: "Escalated ticket T-2042 to Finance", when: "14m ago", tone: "info" },
  { id: "a4", who: "Morgan Admin", what: "Closed SpaceX Series N — $42M raised", when: "1h ago", tone: "success" },
  { id: "a5", who: "Security", what: "5 failed login attempts blocked", when: "2h ago", tone: "danger" },
  { id: "a6", who: "System", what: "Withdrawal $75,000 — flagged for review", when: "3h ago", tone: "warning" },
];

export const adminUsers = [
  { id: "u-41208", name: "Eleanor Vance", email: "e.vance@orbital.cap", country: "US", status: "Active", kyc: "Verified", tier: "VIP", joined: "2024-03-12", invested: 2_140_000, lastLogin: "2026-06-11 09:14" },
  { id: "u-41207", name: "Marcus Reeves", email: "m.reeves@apogee.io", country: "GB", status: "Active", kyc: "Verified", tier: "Pro", joined: "2024-04-02", invested: 482_500, lastLogin: "2026-06-11 07:22" },
  { id: "u-41206", name: "Sofia Okafor", email: "s.okafor@ventures.ng", country: "NG", status: "Active", kyc: "Pending", tier: "Standard", joined: "2026-06-09", invested: 0, lastLogin: "2026-06-10 22:01" },
  { id: "u-41205", name: "Kenji Tanaka", email: "k.tanaka@starwealth.jp", country: "JP", status: "Active", kyc: "Verified", tier: "VIP", joined: "2024-08-21", invested: 980_400, lastLogin: "2026-06-10 18:44" },
  { id: "u-41204", name: "Amelia Hart", email: "a.hart@northcap.uk", country: "GB", status: "Suspended", kyc: "Rejected", tier: "Standard", joined: "2025-11-14", invested: 0, lastLogin: "2026-05-30 11:08" },
  { id: "u-41203", name: "Diego Romero", email: "d.romero@aurelio.mx", country: "MX", status: "Active", kyc: "Verified", tier: "Pro", joined: "2025-02-19", invested: 312_000, lastLogin: "2026-06-11 02:33" },
  { id: "u-41202", name: "Priya Kapoor", email: "p.kapoor@horizon.in", country: "IN", status: "Active", kyc: "Pending", tier: "Standard", joined: "2026-06-08", invested: 0, lastLogin: "2026-06-10 14:50" },
  { id: "u-41201", name: "Henrik Larsen", email: "h.larsen@nord.dk", country: "DK", status: "Banned", kyc: "Rejected", tier: "Standard", joined: "2025-04-30", invested: 0, lastLogin: "2026-04-12 09:18" },
  { id: "u-41200", name: "Yuki Sato", email: "y.sato@stellar.jp", country: "JP", status: "Active", kyc: "Verified", tier: "VIP", joined: "2024-01-08", invested: 4_120_000, lastLogin: "2026-06-11 10:02" },
  { id: "u-41199", name: "Olivia Brent", email: "o.brent@meridian.au", country: "AU", status: "Active", kyc: "Verified", tier: "Pro", joined: "2025-06-22", invested: 215_000, lastLogin: "2026-06-10 16:40" },
];

export const kycQueue = [
  { id: "k-9821", user: "Sofia Okafor", country: "NG", submitted: "2026-06-09 22:14", status: "Pending", docs: ["Passport", "Utility Bill", "Selfie"], notes: 0 },
  { id: "k-9820", user: "Priya Kapoor", country: "IN", submitted: "2026-06-08 14:50", status: "Pending", docs: ["National ID", "Bank Statement"], notes: 1 },
  { id: "k-9819", user: "Lucas Becker", country: "DE", submitted: "2026-06-07 09:22", status: "Review", docs: ["Passport", "Utility Bill"], notes: 2 },
  { id: "k-9818", user: "Mei Lin", country: "SG", submitted: "2026-06-06 18:01", status: "Review", docs: ["Passport", "Proof of Income", "Selfie"], notes: 0 },
  { id: "k-9817", user: "Daniel Cohen", country: "IL", submitted: "2026-06-05 11:08", status: "Approved", docs: ["Passport", "Utility Bill"], notes: 1, reviewer: "Morgan Admin" },
  { id: "k-9816", user: "Amelia Hart", country: "GB", submitted: "2026-06-04 16:40", status: "Rejected", docs: ["Driver License"], notes: 3, reviewer: "Sam Support" },
];

export const investmentOps = [
  { id: "op-1", name: "SpaceX Series N — Late Stage", status: "Open", raised: 42_120_000, target: 50_000_000, investors: 312, closes: "2026-08-15" },
  { id: "op-2", name: "Starlink Infrastructure Bond II", status: "Open", raised: 18_400_000, target: 25_000_000, investors: 892, closes: "2026-07-02" },
  { id: "op-3", name: "Tesla Optimus Robotics Fund", status: "Paused", raised: 8_220_000, target: 40_000_000, investors: 184, closes: "2026-09-30" },
  { id: "op-4", name: "Starbase Real Estate Trust", status: "Open", raised: 12_900_000, target: 20_000_000, investors: 421, closes: "2026-10-12" },
  { id: "op-5", name: "Falcon Heavy Launch Fund I", status: "Closed", raised: 60_000_000, target: 60_000_000, investors: 1_204, closes: "2026-05-20" },
];

export const pendingInvestments = [
  { id: "i-2204", user: "Kenji Tanaka", opp: "SpaceX Series N", amount: 250_000, submitted: "2026-06-11 09:01", status: "Pending" },
  { id: "i-2203", user: "Eleanor Vance", opp: "SpaceX Series N", amount: 1_000_000, submitted: "2026-06-10 22:18", status: "Pending" },
  { id: "i-2202", user: "Marcus Reeves", opp: "Starlink Bond II", amount: 75_000, submitted: "2026-06-10 18:40", status: "Pending" },
  { id: "i-2201", user: "Diego Romero", opp: "Starbase REIT", amount: 50_000, submitted: "2026-06-10 14:12", status: "Pending" },
];

export const wallets = [
  { id: "w-001", user: "Eleanor Vance", balance: 482_120, currency: "USD", status: "Active", lastTx: "2026-06-11 09:14" },
  { id: "w-002", user: "Marcus Reeves", balance: 88_400, currency: "USD", status: "Active", lastTx: "2026-06-11 07:22" },
  { id: "w-003", user: "Sofia Okafor", balance: 12_500, currency: "USD", status: "Active", lastTx: "2026-06-10 22:01" },
  { id: "w-004", user: "Kenji Tanaka", balance: 1_204_000, currency: "USD", status: "Active", lastTx: "2026-06-10 18:44" },
  { id: "w-005", user: "Amelia Hart", balance: 0, currency: "USD", status: "Frozen", lastTx: "2026-05-30 11:08" },
  { id: "w-006", user: "Diego Romero", balance: 42_800, currency: "USD", status: "Active", lastTx: "2026-06-11 02:33" },
  { id: "w-007", user: "Yuki Sato", balance: 3_120_400, currency: "USD", status: "Active", lastTx: "2026-06-11 10:02" },
];

export const deposits = [
  { id: "d-9904", user: "Eleanor Vance", amount: 250_000, method: "Bank Wire", status: "Pending", submitted: "2026-06-11 08:01", ref: "WIRE-EV-220611" },
  { id: "d-9903", user: "Diego Romero", amount: 25_000, method: "USDC", status: "Processing", submitted: "2026-06-11 06:14", ref: "0x82af…d1" },
  { id: "d-9902", user: "Marcus Reeves", amount: 100_000, method: "Bank Wire", status: "Pending", submitted: "2026-06-10 22:40", ref: "WIRE-MR-220610" },
  { id: "d-9901", user: "Kenji Tanaka", amount: 500_000, method: "Bank Wire", status: "Approved", submitted: "2026-06-10 14:12", ref: "WIRE-KT-220610", reviewer: "Morgan Admin" },
  { id: "d-9900", user: "Sofia Okafor", amount: 5_000, method: "Card", status: "Rejected", submitted: "2026-06-10 11:08", ref: "CARD-SO-001", reviewer: "Morgan Admin" },
];

export const withdrawals = [
  { id: "wd-4421", user: "Yuki Sato", amount: 250_000, method: "Bank Wire", status: "Pending", submitted: "2026-06-11 09:30", dest: "•••• 4421" },
  { id: "wd-4420", user: "Eleanor Vance", amount: 100_000, method: "Bank Wire", status: "Pending", submitted: "2026-06-11 07:14", dest: "•••• 2208" },
  { id: "wd-4419", user: "Marcus Reeves", amount: 25_000, method: "USDC", status: "Processing", submitted: "2026-06-10 22:01", dest: "0xa1f3…b8" },
  { id: "wd-4418", user: "Diego Romero", amount: 15_000, method: "Bank Wire", status: "Approved", submitted: "2026-06-10 18:44", dest: "•••• 0918" },
  { id: "wd-4417", user: "Amelia Hart", amount: 8_000, method: "Bank Wire", status: "Rejected", submitted: "2026-05-30 11:08", dest: "•••• 5510" },
];

export const adminTransactions = [
  { id: "tx-100221", user: "Eleanor Vance", type: "Deposit", amount: 250_000, status: "Pending", date: "2026-06-11 08:01" },
  { id: "tx-100220", user: "Yuki Sato", type: "Withdrawal", amount: -250_000, status: "Pending", date: "2026-06-11 09:30" },
  { id: "tx-100219", user: "Kenji Tanaka", type: "Investment", amount: -250_000, status: "Pending", date: "2026-06-11 09:01" },
  { id: "tx-100218", user: "Diego Romero", type: "Deposit", amount: 25_000, status: "Processing", date: "2026-06-11 06:14" },
  { id: "tx-100217", user: "Marcus Reeves", type: "Investment", amount: -75_000, status: "Pending", date: "2026-06-10 18:40" },
  { id: "tx-100216", user: "Kenji Tanaka", type: "Deposit", amount: 500_000, status: "Completed", date: "2026-06-10 14:12" },
  { id: "tx-100215", user: "Eleanor Vance", type: "Dividend", amount: 4_120, status: "Completed", date: "2026-06-09 00:00" },
  { id: "tx-100214", user: "Yuki Sato", type: "Investment", amount: -1_000_000, status: "Completed", date: "2026-06-08 11:20" },
];

export const securityEvents = [
  { id: "s-1", kind: "Failed Login", user: "h.larsen@nord.dk", ip: "203.0.113.42", device: "Chrome / Windows", at: "2026-06-11 09:48", severity: "high" },
  { id: "s-2", kind: "New Device", user: "Eleanor Vance", ip: "98.45.12.10", device: "Safari / macOS", at: "2026-06-11 09:14", severity: "low" },
  { id: "s-3", kind: "Account Locked", user: "a.hart@northcap.uk", ip: "82.14.221.5", device: "Firefox / Ubuntu", at: "2026-06-11 02:11", severity: "high" },
  { id: "s-4", kind: "Password Reset", user: "Marcus Reeves", ip: "203.0.114.18", device: "Safari / iOS", at: "2026-06-10 22:01", severity: "low" },
  { id: "s-5", kind: "Suspicious IP", user: "Sofia Okafor", ip: "45.155.205.220", device: "Tor Browser", at: "2026-06-10 18:44", severity: "high" },
  { id: "s-6", kind: "2FA Disabled", user: "Diego Romero", ip: "189.203.18.7", device: "Chrome / Android", at: "2026-06-10 14:50", severity: "medium" },
];

export const auditLog = [
  { id: "L-9100", actor: "Morgan Admin", action: "ROLE_GRANTED", target: "u-41208 → vip", at: "2026-06-11 09:14", ip: "10.0.4.12", device: "Chrome / macOS" },
  { id: "L-9099", actor: "Morgan Admin", action: "KYC_APPROVED", target: "k-9817", at: "2026-06-11 08:42", ip: "10.0.4.12", device: "Chrome / macOS" },
  { id: "L-9098", actor: "Sam Support", action: "TICKET_ESCALATED", target: "T-2042", at: "2026-06-11 08:01", ip: "10.0.4.18", device: "Safari / macOS" },
  { id: "L-9097", actor: "System", action: "WITHDRAWAL_FLAGGED", target: "wd-4421", at: "2026-06-11 07:30", ip: "internal", device: "—" },
  { id: "L-9096", actor: "Morgan Admin", action: "WALLET_FROZEN", target: "w-005", at: "2026-06-10 22:01", ip: "10.0.4.12", device: "Chrome / macOS" },
  { id: "L-9095", actor: "Morgan Admin", action: "OPP_CLOSED", target: "op-5", at: "2026-06-10 18:44", ip: "10.0.4.12", device: "Chrome / macOS" },
  { id: "L-9094", actor: "Sam Support", action: "KYC_REJECTED", target: "k-9816", at: "2026-06-10 14:12", ip: "10.0.4.18", device: "Safari / macOS" },
];

// SUPPORT
export const supportKpis = {
  openTickets: 64,
  pendingTickets: 22,
  escalatedTickets: 8,
  resolvedToday: 41,
  kycQueueSize: 18,
  avgResponseMin: 12,
};

export const tickets = [
  { id: "T-2042", subject: "Wire confirmation timing", user: "Eleanor Vance", priority: "Normal", status: "Open", assignee: "Sam Support", updated: "1h ago", channel: "Email" },
  { id: "T-2041", subject: "Allocation question — Series N", user: "Kenji Tanaka", priority: "High", status: "In Progress", assignee: "Sam Support", updated: "2h ago", channel: "Chat" },
  { id: "T-2040", subject: "Update bank beneficiary name", user: "Marcus Reeves", priority: "Normal", status: "Pending", assignee: "Unassigned", updated: "3h ago", channel: "Email" },
  { id: "T-2039", subject: "KYC document upload issue", user: "Sofia Okafor", priority: "High", status: "Escalated", assignee: "Compliance", updated: "5h ago", channel: "Chat" },
  { id: "T-2038", subject: "2FA recovery", user: "Diego Romero", priority: "Urgent", status: "Open", assignee: "Sam Support", updated: "6h ago", channel: "Phone" },
  { id: "T-2037", subject: "Question about Starlink dividends", user: "Yuki Sato", priority: "Low", status: "Resolved", assignee: "Sam Support", updated: "1d ago", channel: "Email" },
  { id: "T-2036", subject: "Tax form 1099 download", user: "Olivia Brent", priority: "Normal", status: "Closed", assignee: "Sam Support", updated: "2d ago", channel: "Email" },
];

export const ticketThread = [
  { who: "Eleanor Vance", at: "2026-06-11 08:01", body: "I wired $250,000 from my Chase account around 7:45am UTC and the deposit is not yet visible. Can you confirm when it should land?" },
  { who: "Sam Support", at: "2026-06-11 08:14", body: "Hi Eleanor — wires from Chase typically take 1–4 business hours to settle into our custody account. I can see your reference WIRE-EV-220611 is in the pending queue. I'll mark it for priority review with Finance." },
  { who: "Eleanor Vance", at: "2026-06-11 08:18", body: "Thank you — please notify me as soon as it clears." },
];

// EMPLOYEE
export const employeeKpis = {
  pendingReviews: 14,
  openTasks: 9,
  documentsThisWeek: 218,
  reportsGenerated: 32,
};

export const internalDocs = [
  { id: "doc-1", name: "Q2 2026 — Investor Compliance Pack.pdf", category: "Compliance", owner: "Morgan Admin", updated: "2026-06-10", size: "4.2 MB" },
  { id: "doc-2", name: "SpaceX Series N — Subscription Template.pdf", category: "Contracts", owner: "Legal", updated: "2026-06-08", size: "1.8 MB" },
  { id: "doc-3", name: "May 2026 Custody Statement.pdf", category: "Statements", owner: "Finance", updated: "2026-06-01", size: "912 KB" },
  { id: "doc-4", name: "Internal Risk Memo — Wire Fraud Patterns.docx", category: "Compliance", owner: "Risk", updated: "2026-05-29", size: "640 KB" },
  { id: "doc-5", name: "2025 1099-DIV Bulk Generation Report.xlsx", category: "Tax", owner: "Finance", updated: "2026-03-01", size: "2.1 MB" },
  { id: "doc-6", name: "AML Procedures v3.4.pdf", category: "Compliance", owner: "Compliance", updated: "2026-02-12", size: "1.1 MB" },
];

export const reports = [
  { id: "rp-1", name: "Daily Investor Activity", category: "Investor", lastRun: "2026-06-11 06:00", format: "CSV / PDF" },
  { id: "rp-2", name: "Transaction Settlement Report", category: "Transactions", lastRun: "2026-06-11 06:15", format: "CSV" },
  { id: "rp-3", name: "KYC Pipeline Weekly", category: "Compliance", lastRun: "2026-06-10 18:00", format: "PDF" },
  { id: "rp-4", name: "AUM Snapshot", category: "Operational", lastRun: "2026-06-11 06:30", format: "PDF" },
  { id: "rp-5", name: "Withdrawal Risk Review", category: "Compliance", lastRun: "2026-06-10 22:00", format: "PDF" },
];

export const tasks = [
  { id: "tk-1", title: "Review pending KYC batch (18)", assignee: "Sam Support", due: "Today", priority: "High", status: "In Progress" },
  { id: "tk-2", title: "Reconcile June wire deposits", assignee: "Finance Ops", due: "Today", priority: "High", status: "Todo" },
  { id: "tk-3", title: "Publish Q2 investor letter", assignee: "Comms", due: "2026-06-15", priority: "Normal", status: "Todo" },
  { id: "tk-4", title: "Update AML monitoring rules", assignee: "Compliance", due: "2026-06-18", priority: "Normal", status: "Todo" },
  { id: "tk-5", title: "Series N — finalize closing memo", assignee: "Legal", due: "2026-06-20", priority: "Normal", status: "In Review" },
  { id: "tk-6", title: "Audit log archival (May)", assignee: "Security", due: "2026-06-12", priority: "Low", status: "Done" },
];

export const staffNotifications = [
  { id: "n-1", kind: "Approval", title: "Wire deposit $250,000 awaiting approval", body: "WIRE-EV-220611 — Eleanor Vance", at: "10m ago", unread: true },
  { id: "n-2", kind: "Escalation", title: "Ticket T-2039 escalated to Compliance", body: "KYC document upload issue — Sofia Okafor", at: "1h ago", unread: true },
  { id: "n-3", kind: "Security", title: "5 failed login attempts blocked", body: "Source IP 203.0.113.42 — auto-throttled", at: "2h ago", unread: true },
  { id: "n-4", kind: "Review", title: "Withdrawal $250,000 flagged for review", body: "wd-4421 — Yuki Sato", at: "3h ago", unread: false },
  { id: "n-5", kind: "Approval", title: "KYC k-9819 ready for final approval", body: "Lucas Becker — DE", at: "5h ago", unread: false },
];
