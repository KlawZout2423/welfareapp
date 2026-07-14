/**
 * navConfig.js — Single source of truth for all navigation & service cards.
 *
 * Adding a new welfare service:  add ONE entry to STAFF_SERVICES.
 *   → The sidebar link, dashboard card, and quick action all update automatically.
 *
 * Adding a new admin tab:        add ONE entry to ADMIN_NAV (in the right section).
 *   → The sidebar updates automatically.
 */

import {
  BarChart2, CreditCard, Heart, Landmark,
  Users, FileText, Send, History,
  Settings as SettingsIcon,
  Stethoscope, Umbrella, TrendingUp, Headphones,
  Download, Activity, Plus,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// STAFF — sidebar navigation tabs
// tab    : key used by setActiveTab / activeTab state
// label  : text shown in sidebar
// icon   : Lucide icon component
// badge  : optional fn(loans, claims, members, userProfile) → number|null
// ─────────────────────────────────────────────────────────────────────────────
export const STAFF_NAV = [
  {
    tab: "overview",
    label: "My Overview",
    icon: BarChart2,
  },
  {
    tab: "contributions",
    label: "My Dues Statement",
    icon: CreditCard,
  },
  {
    tab: "claims",
    label: "My Welfare Claims",
    icon: Heart,
  },
  {
    tab: "loans",
    label: "Emergency Loans",
    icon: Landmark,
    badge: (loans, _claims, _members, userProfile) => {
      const n = loans.filter(
        l => l.applicant === userProfile.name && l.status === "Pending"
      ).length;
      return n > 0 ? n : null;
    },
    badgeStyle: "gold",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAFF — welfare service cards (StaffOverview dashboard grid)
// tab    : setActiveTab destination (use null for modal/alert actions)
// modal  : "payment" | "claim" | "loan" | null
// alert  : string shown via alert() when no tab/modal applies
// color  : "navy" | "gold" | "green" | "red" | "blue"
// btnColor: "primary" | "gold" | "outline"
// ─────────────────────────────────────────────────────────────────────────────
export const STAFF_SERVICES = [
  {
    id: "loans",
    tab: "loans",
    modal: "loan",
    icon: Landmark,
    title: "Emergency Loans",
    desc: "Zero-interest salary-deductible credit advance up to GH₵1,500.",
    color: "gold",
    btnLabel: "Apply Now",
    btnColor: "gold",
  },
  {
    id: "medical",
    tab: "claims",
    modal: "claim",
    icon: Stethoscope,
    title: "Medical & Illness Support",
    desc: "Critical illness grants and hospitalisation payout up to GH₵6,000.",
    color: "red",
    btnLabel: "File Claim",
    btnColor: "primary",
  },
  {
    id: "bereavement",
    tab: "claims",
    modal: "claim",
    icon: Umbrella,
    title: "Bereavement Insurance",
    desc: "Condolence supports for death of member, spouse, child, or parents.",
    color: "blue",
    btnLabel: "Start Claim",
    btnColor: "primary",
  },
  {
    id: "retirement",
    tab: "claims",
    modal: null,
    icon: TrendingUp,
    title: "Retirement Benefits",
    desc: "Lump-sum retirement package for all verified active scheme members.",
    color: "green",
    btnLabel: "Check Eligibility",
    btnColor: "outline",
  },
  {
    id: "forms",
    tab: null,
    modal: null,
    icon: Download,
    title: "Download Forms & Docs",
    desc: "Access welfare claim forms, loan application PDFs, and your statement.",
    color: "navy",
    btnLabel: "Download",
    btnColor: "outline",
    handler: "downloadForms",
  },
  {
    id: "contact",
    tab: null,
    modal: null,
    icon: Headphones,
    title: "Contact Welfare Office",
    desc: "Reach the HTU Welfare Secretariat for guidance on claims and payouts.",
    color: "red",
    btnLabel: "Get Help",
    btnColor: "outline",
    alert: "HTU Welfare Secretariat\n📞 0302 000 000\n✉ welfare@htu.edu.gh\n🏢 Admin Block, Room 101",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAFF — quick actions tray (horizontal shortcut bar above the stats)
// ─────────────────────────────────────────────────────────────────────────────
export const STAFF_QUICK_ACTIONS = [
  {
    id: "pay",
    label: "Pay Dues",
    icon: CreditCard,
    color: "bg-blue-50 text-blue-700",
    modal: "payment",
  },
  {
    id: "claim",
    label: "File Claim",
    icon: Heart,
    color: "bg-red-50 text-red-600",
    modal: "claim",
  },
  {
    id: "loan",
    label: "Apply Loan",
    icon: Landmark,
    color: "bg-amber-50 text-amber-700",
    modal: "loan",
  },
  {
    id: "track",
    label: "Track Status",
    icon: Activity,
    color: "bg-green-50 text-green-700",
    tab: "claims",
  },
  {
    id: "forms",
    label: "Download Forms",
    icon: Download,
    color: "bg-slate-50 text-slate-700",
    handler: "downloadForms",
  },
  {
    id: "contact",
    label: "Contact Office",
    icon: Headphones,
    color: "bg-indigo-50 text-indigo-700",
    alert: "HTU Welfare Secretariat\n📞 0302 000 000\n✉ welfare@htu.edu.gh",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — sidebar navigation (grouped by section)
// section: optional section heading above this item
// ─────────────────────────────────────────────────────────────────────────────
export const ADMIN_NAV = [
  // ── Main
  { tab: "dashboard", label: "Dashboard", icon: BarChart2 },
  {
    tab: "members",
    label: "Members",
    icon: Users,
    badge: (_l, _c, members) => members.length,
    badgeStyle: "gold",
  },

  // ── Finance
  { section: "Finance" },
  { tab: "contributions", label: "Contributions Ledger", icon: CreditCard },
  {
    tab: "claims",
    label: "Benefit Claims",
    icon: Heart,
    badge: (_l, claims) => {
      const n = claims.filter(c => c.status === "Pending").length;
      return n > 0 ? n : null;
    },
    badgeStyle: "red",
  },
  {
    tab: "loans",
    label: "Emergency Loans",
    icon: Landmark,
    badge: (loans) => {
      const n = loans.filter(l => l.status === "Pending").length;
      return n > 0 ? n : null;
    },
    badgeStyle: "gold",
  },
  { tab: "reports", label: "Financial Reports", icon: FileText },

  // ── System
  { section: "System" },
  { tab: "sms", label: "SMS Broadcast", icon: Send },
  { tab: "audit", label: "Audit Trail Log", icon: History },
];

// ─────────────────────────────────────────────────────────────────────────────
// AUDITOR — sidebar navigation (read-only subset of admin nav)
// ─────────────────────────────────────────────────────────────────────────────
export const AUDITOR_NAV = [
  { tab: "dashboard", label: "Dashboard Overview", icon: BarChart2 },
  { tab: "members", label: "Members Registry", icon: Users },
  { section: "Finance" },
  { tab: "contributions", label: "Contributions Ledger", icon: CreditCard },
  { tab: "claims", label: "Benefit Claims", icon: Heart },
  { tab: "loans", label: "Emergency Loans", icon: Landmark },
  { tab: "reports", label: "Financial Reports", icon: FileText },
  { section: "System" },
  { tab: "audit", label: "Audit Trail Log", icon: History },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — quick actions tray
// ─────────────────────────────────────────────────────────────────────────────
export const ADMIN_QUICK_ACTIONS = [
  {
    id: "add-member",
    label: "Register Member",
    icon: Plus,
    color: "bg-blue-50 text-blue-700",
    tab: "members",
    modal: "member",
  },
  {
    id: "claims",
    label: "Process Claims",
    icon: Heart,
    color: "bg-red-50 text-red-600",
    tab: "claims",
  },
  {
    id: "sms",
    label: "Send Broadcast",
    icon: Send,
    color: "bg-amber-50 text-amber-700",
    tab: "sms",
  },
  {
    id: "reports",
    label: "Export Reports",
    icon: FileText,
    color: "bg-sky-50 text-sky-700",
    tab: "reports",
  },
  {
    id: "backup",
    label: "Backup Database",
    icon: Download,
    color: "bg-green-50 text-green-700",
    alert: "Simulation: Downloading scheme ledger backup.",
  },
];
