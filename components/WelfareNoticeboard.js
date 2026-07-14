"use client";

import { useState } from "react";
import { Sparkles, Plus, Trash2, MessageSquare } from "lucide-react";

export default function WelfareNoticeboard({ notices = [], userRole, onCreateNotice, onDeleteNotice }) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setIsSubmitting(true);
    await onCreateNotice(category, title.trim(), body.trim());
    setTitle("");
    setBody("");
    setCategory("Announcement");
    setShowForm(false);
    setIsSubmitting(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const categoryStyles = {
    Announcement: { bg: "bg-gold-pale", text: "text-gold", label: "Announcement" },
    "Scheme Update": { bg: "bg-green-pale", text: "text-green", label: "Scheme Update" },
    Urgent: { bg: "bg-red-pale", text: "text-red", label: "Urgent" },
  };

  return (
    <div className="card">
      <div className="card-header bg-gold-pale/30 border-b border-gold/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <div className="card-title font-semibold text-navy">Welfare Board Noticeboard</div>
        </div>
        {userRole === "admin" && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-3.5 h-3.5" /> Post Notice
          </button>
        )}
      </div>
      <div className="card-body space-y-4">
        {/* Admin compose form */}
        {showForm && userRole === "admin" && (
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
            <div className="flex gap-3">
              <div className="form-field flex-1">
                <label className="text-[10px] font-bold text-text-3 uppercase">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs">
                  <option>Announcement</option>
                  <option>Scheme Update</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div className="form-field flex-[3]">
                <label className="text-[10px] font-bold text-text-3 uppercase">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notice title..."
                  required
                  className="text-xs"
                />
              </div>
            </div>
            <div className="form-field">
              <label className="text-[10px] font-bold text-text-3 uppercase">Content</label>
              <textarea
                rows="2"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write notice content..."
                required
                className="text-xs"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Publish Notice"}
              </button>
            </div>
          </form>
        )}

        {/* Notices list */}
        {notices.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <MessageSquare className="w-8 h-8 text-border mx-auto" />
            <p className="text-xs text-text-3 font-semibold">No notices posted yet.</p>
          </div>
        ) : (
          notices.map((notice) => {
            const style = categoryStyles[notice.category] || categoryStyles.Announcement;
            return (
              <div key={notice.id} className="p-4 bg-slate-50/50 border border-slate-200/40 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-bold ${style.text} uppercase ${style.bg} px-2 py-0.5 rounded`}>
                    {style.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-3 font-semibold">{formatDate(notice.createdAt)}</span>
                    {userRole === "admin" && onDeleteNotice && (
                      <button
                        onClick={() => onDeleteNotice(notice.id)}
                        className="text-text-3 hover:text-red transition-colors"
                        title="Delete notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="text-xs font-bold text-navy-deep">{notice.title}</h4>
                <p className="text-xs text-text-2 leading-relaxed">{notice.body}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
