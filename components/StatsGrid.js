"use client";

import { Users, CreditCard, Landmark, Heart } from "lucide-react";

export default function StatsGrid({
  members,
  claims,
  fundStats
}) {
  return (
    <div className="stats-grid">
      <div className="stat-card navy">
        <div className="stat-icon navy-bg"><Users className="h-5 w-5" /></div>
        <div className="stat-val">{members.length}</div>
        <div className="stat-label-text">Active Members</div>
        <span className="stat-change up">↑ 12 this month</span>
      </div>

      <div className="stat-card gold">
        <div className="stat-icon gold-bg"><CreditCard className="h-5 w-5" /></div>
        <div className="stat-val">GH₵{fundStats.juneCollections.toLocaleString()}</div>
        <div className="stat-label-text">June Collections</div>
        <span className="stat-change up">↑ 96.2% compliance</span>
      </div>

      <div className="stat-card green">
        <div className="stat-icon green-bg"><Landmark className="h-5 w-5" /></div>
        <div className="stat-val">GH₵{fundStats.totalFund.toLocaleString()}</div>
        <div className="stat-label-text">Scheme Fund Balance</div>
        <span className="stat-change up">↑ GH₵2,150 vs last mo.</span>
      </div>

      <div className="stat-card red">
        <div className="stat-icon red-bg"><Heart className="h-5 w-5" /></div>
        <div className="stat-val">{claims.filter(c => c.status === "Pending").length}</div>
        <div className="stat-label-text">Pending Claims</div>
        <span className="stat-change down">↑ 2 new today</span>
      </div>
    </div>
  );
}
