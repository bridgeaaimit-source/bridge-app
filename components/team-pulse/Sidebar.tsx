"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Target,
  MessageSquareCheck,
  Calculator,
  BrainCircuit,
  Users2,
  TrendingUp,
  UserCheck,
  BarChart3,
  ArrowRightLeft,
  ShieldAlert,
  Smile,
  ShieldCheck,
  Scale,
  Bot,
} from "lucide-react";

interface SidebarProps {
  organizationName?: string;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

const GROUPS = [
  {
    key: "overview",
    label: "Overview",
    color: "var(--sky)",
    items: [
      { id: "dashboard", href: "/team-pulse", label: "Command Center", icon: LayoutDashboard },
    ],
  },
  {
    key: "hire",
    label: "Hire",
    color: "var(--indigo)",
    items: [
      { id: "jd-studio", href: "/team-pulse/jd-studio", label: "JD Studio", icon: FileText },
      { id: "sourcing", href: "/team-pulse/sourcing", label: "Candidate Sourcing", icon: Users },
      { id: "job-fit", href: "/team-pulse/job-fit", label: "Person–Job Fit", icon: Target },
      { id: "interviews", href: "/team-pulse/interviews", label: "Structured Interviews", icon: MessageSquareCheck },
      { id: "offer-studio", href: "/team-pulse/offer-studio", label: "Offer Studio", icon: Calculator },
    ],
  },
  {
    key: "people",
    label: "People",
    color: "var(--rose)",
    items: [
      { id: "personality-lab", href: "/team-pulse/personality-lab", label: "Personality Lab", icon: BrainCircuit },
      { id: "team-chemistry", href: "/team-pulse/team-chemistry", label: "Team Chemistry", icon: Users2, badge: "AI" },
      { id: "performance", href: "/team-pulse/performance", label: "Performance & PIPs", icon: TrendingUp },
      { id: "onboarding", href: "/team-pulse/onboarding", label: "Onboarding", icon: UserCheck },
    ],
  },
  {
    key: "plan",
    label: "Plan",
    color: "var(--green)",
    items: [
      { id: "workforce-planner", href: "/team-pulse/workforce-planner", label: "Workforce Planner", icon: BarChart3 },
      { id: "internal-mobility", href: "/team-pulse/internal-mobility", label: "Internal Mobility", icon: ArrowRightLeft },
    ],
  },
  {
    key: "care",
    label: "Retain & Comply",
    color: "var(--amber)",
    items: [
      { id: "attrition-radar", href: "/team-pulse/attrition-radar", label: "Attrition Radar", icon: ShieldAlert },
      { id: "engagement", href: "/team-pulse/engagement", label: "Engagement & Sentiment", icon: Smile },
      { id: "compliance", href: "/team-pulse/compliance", label: "Compliance Center", icon: ShieldCheck, badge: "New" },
      { id: "fairness-audit", href: "/team-pulse/fairness-audit", label: "Fairness Audit", icon: Scale },
    ],
  },
  {
    key: "assist",
    label: "Assist",
    color: "var(--violet)",
    items: [
      { id: "copilot", href: "/team-pulse/copilot", label: "HR Copilot", icon: Bot, badge: "AI" },
    ],
  },
];

export default function Sidebar({ organizationName = "Rocket India", userName, userRole, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="tp-side">
      <div className="tp-brand">
        <div className="tp-brand-mark">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l2-5 4 10 2-5h6" />
          </svg>
        </div>
        <div>
          <div className="tp-brand-name">Team Pulse</div>
          <div className="tp-brand-sub">by Bridge AI · {organizationName}</div>
        </div>
      </div>

      <nav className="tp-nav">
        {GROUPS.map((group) => (
          <div key={group.key} className="tp-nav-group" data-group={group.key}>
            <div className="tp-nav-label">
              <i style={{ width: 7, height: 7, borderRadius: "50%", background: group.color }} />
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`tp-nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon style={{ width: 18, height: 18, flexShrink: 0, color: isActive ? group.color : "var(--faint)" }} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "99px",
                        background: "var(--indigo-soft)",
                        color: "var(--indigo-ink)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        {userName && (
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: 8 }}>
            Logged in as <b>{userName}</b> ({userRole})
          </div>
        )}
        <button
          onClick={onLogout}
          className="tp-btn"
          style={{ width: "100%", fontSize: "12.5px", padding: "6px 10px" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
