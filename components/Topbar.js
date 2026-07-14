"use client";

import { useEffect, useRef } from "react";
import { Search, Bell, ShieldCheck, Menu } from "lucide-react";

const TAB_TITLES = {
  dashboard: "Dashboard",
  overview: "My Overview Ledger",
  members: "Members Registry",
  reports: "Financial Reports",
  sms: "SMS Broadcast Panel",
  audit: "Audit Trail log",
};

export default function Topbar({
  userRole, userProfile, activeTab,
  searchQuery, setSearchQuery,
  notifications, isNotifOpen, setIsNotifOpen,
  markAllNotifRead, isMobileMenuOpen, setIsMobileMenuOpen,
}) {
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isNotifOpen &&
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen, setIsNotifOpen]);

  const getTitle = () => {
    if (activeTab === "contributions") return userRole === "staff" ? "My Dues statement" : "Contributions Ledger";
    if (activeTab === "claims") return userRole === "staff" ? "My Benefit Claims" : "Benefit Claims Queue";
    if (activeTab === "loans") return "Emergency Loans Facility";
    if (activeTab === "settings") return userRole === "staff" ? "My Profile Settings" : "Portal Configuration";
    return TAB_TITLES[activeTab] || "";
  };

  return (
    <header className="topbar">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden p-2 text-navy hover:bg-cream rounded-lg"
        aria-label="Toggle Navigation Sidebar"
        aria-expanded={isMobileMenuOpen}
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="topbar-title">
        <h1>{getTitle()}</h1>
        <p className="flex items-center gap-1.5 flex-wrap">
          {userRole === "staff" ? (
            <>
              <span>Staff ID: {userProfile.id} · {userProfile.department}</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] text-green font-bold bg-green-pale px-1.5 py-0.5 rounded border border-green/20">
                <ShieldCheck className="w-2.5 h-2.5 text-green" /> Verified Member
              </span>
            </>
          ) : "HTU Staff Welfare Scheme Secretariat"}
        </p>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search hidden md:flex">
          <Search className="h-4 w-4 text-text-3" />
          <input
            type="text"
            placeholder="Search ledger, claims..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search active ledger database"
          />
        </div>

        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="icon-btn"
            aria-label="Toggle notification alerts"
            aria-expanded={isNotifOpen}
          >
            <Bell className="h-5 w-5" />
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="notif-dot"></span>
            )}
          </button>

          {isNotifOpen && (
            <div ref={dropdownRef} className="notif-dropdown open" role="dialog" aria-label="Notifications alerts">
              <div className="notif-head">
                <h4>Notifications</h4>
                <button onClick={markAllNotifRead} className="notif-mark-all">Mark all read</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`notif-item ${n.unread ? "unread" : ""}`}>
                    <span className={`notif-dot2 ${n.unread ? "" : "read"}`}></span>
                    <div className="notif-info text-left">
                      <p className="notif-text">{n.text}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {userRole === "auditor" && (
          <div className="border border-red/40 bg-red-pale/40 text-red text-[10px] font-bold px-2 py-1 rounded">
            AUDIT MODE
          </div>
        )}
        <div className="topbar-avatar" aria-label={`User avatar initials for ${userProfile.name || ""}`}>{userProfile.avatarInitials}</div>
      </div>
    </header>
  );
}
