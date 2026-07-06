"use client";

import { Sparkles } from "lucide-react";

export default function WelfareNoticeboard() {
  return (
    <div className="card">
      <div className="card-header bg-gold-pale/30 border-b border-gold/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <div className="card-title font-semibold text-navy">Welfare Board Noticeboard</div>
        </div>
      </div>
      <div className="card-body space-y-4">
        <div className="p-4 bg-cream/40 rounded-xl border border-border/20 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-gold uppercase bg-gold-pale px-2 py-0.5 rounded">Announcement</span>
            <span className="text-[10px] text-text-3 font-semibold">Today, 10:14</span>
          </div>
          <h4 className="text-xs font-bold text-navy-deep">Annual Welfare Scheme General Meeting</h4>
          <p className="text-xs text-text-2 leading-relaxed">
            All staff members are invited to our annual meeting on <strong>July 28, 2026</strong> at the HTU Auditorium.
            Important dues restructuring discussions will take place.
          </p>
        </div>

        <div className="p-4 bg-cream/40 rounded-xl border border-border/20 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-green uppercase bg-green-pale px-2 py-0.5 rounded">Scheme Update</span>
            <span className="text-[10px] text-text-3 font-semibold">Yesterday</span>
          </div>
          <h4 className="text-xs font-bold text-navy-deep">New Critical Illness Policy Allowances</h4>
          <p className="text-xs text-text-2 leading-relaxed">
            The Welfare Board has approved an increase in the maximum claim limit for Critical Illness cover.
            You can read the updated scheme terms in the reports section.
          </p>
        </div>
      </div>
    </div>
  );
}
