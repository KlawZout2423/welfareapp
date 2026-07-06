"use client";

import { Settings as SettingsIcon, LogOut, ShieldCheck } from "lucide-react";
import { STAFF_NAV, ADMIN_NAV, AUDITOR_NAV } from "@/lib/navConfig";

const HTULogo = ({ className = "w-11 h-12" }) => (
  <img src="/htu_logo.jpg" alt="Ho Technical University Logo"
    className={`${className} object-contain rounded-full bg-white p-1 border border-slate-200/50`} />
);

export default function Sidebar({
  userRole, userProfile, activeTab, setActiveTab,
  setCurrentView, setIsMobileMenuOpen, isMobileMenuOpen,
  loans, claims, members
}) {
  const navigate = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Resolve the badge count using each item's badge fn
  const getBadge = (item) => {
    if (!item.badge) return null;
    return item.badge(loans, claims, members, userProfile);
  };

  const navItems = userRole === "staff" ? STAFF_NAV : userRole === "auditor" ? AUDITOR_NAV : ADMIN_NAV;

  return (
    <>
      {/* Mobile backdrop — click closes the menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[99] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className="sidebar"
        data-open={isMobileMenuOpen ? "true" : undefined}
        style={isMobileMenuOpen ? { transform: "translateX(0)" } : undefined}
      >
      {/* Brand */}
      <div className="sidebar-brand">
        <HTULogo />
        <div className="brand-text">
          <div className="brand-name">HTU Staff Welfare</div>
          <div className="brand-sub">Welfare Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <div className="nav-section">Main Menu</div>

        {navItems.map((item, idx) => {
          // Section heading (admin only)
          if (item.section) {
            return <div key={`sec-${idx}`} className="nav-section">{item.section}</div>;
          }

          const Icon = item.icon;
          const badge = getBadge(item);

          return (
            <button
              key={item.tab}
              onClick={() => navigate(item.tab)}
              className={`nav-item w-full ${activeTab === item.tab ? "active" : ""}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {badge != null && (
                <span className={`nav-badge ${item.badgeStyle || ""}`}>{badge}</span>
              )}
            </button>
          );
        })}

        {/* Settings — always last */}
        <button
          onClick={() => navigate("settings")}
          className={`nav-item w-full ${activeTab === "settings" ? "active" : ""}`}
        >
          <SettingsIcon className="h-5 w-5" />
          <span>{userRole === "staff" ? "My Settings" : "System Settings"}</span>
        </button>
      </div>

      {/* Footer: user card */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{userProfile.avatarInitials}</div>
          <div className="user-info">
            <div className="user-name truncate flex items-center gap-1">
              {userProfile.name}
              {userRole === "staff" && (
                <ShieldCheck className="w-3.5 h-3.5 text-gold fill-gold/20 flex-shrink-0" title="Verified Member" />
              )}
            </div>
            <div className="user-role">{userProfile.roleLabel}</div>
          </div>
          <button onClick={() => setCurrentView("login")} className="logout-btn ml-2" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
