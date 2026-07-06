"use client";

import { CreditCard, Heart, Landmark, ShieldCheck, Sparkles, ArrowRight, ShieldAlert, Award, Calendar, BookOpen } from "lucide-react";

const HTULogo = ({ className = "w-16 h-16" }) => (
  <img
    src="/htu_logo.jpg"
    alt="Ho Technical University Logo"
    className={`${className} object-contain rounded-full bg-white p-1 border border-slate-200/50`}
  />
);

export default function LandingPage({ onEnterPortal }) {
  return (
    <div className="min-h-screen bg-cream text-text flex flex-col font-sans selection:bg-gold/30">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-border/40 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <HTULogo className="w-10 h-10" />
          <div>
            <span className="text-xs font-bold text-gold uppercase tracking-wider block">HTU Welfare Board</span>
            <h1 className="text-sm font-extrabold text-navy leading-none">Staff Welfare Scheme</h1>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-text-2">
          <a href="#benefits" className="hover:text-gold transition-colors">Welfare Benefits</a>
          <a href="#loans" className="hover:text-gold transition-colors">Emergency Loans</a>
          <a href="#rules" className="hover:text-gold transition-colors">Eligibility Rules</a>
          <a href="#noticeboard" className="hover:text-gold transition-colors">Notice Board</a>
        </nav>

        <button 
          onClick={onEnterPortal}
          className="btn btn-primary text-xs font-bold px-5 py-2.5 flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          Access Portal <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:py-24 px-6 md:px-12 bg-gradient-to-b from-navy-deep to-[#142347] text-white overflow-hidden">
        <div className="gear-pattern opacity-10 absolute inset-0"></div>
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gold">
            <Sparkles className="w-4 h-4" />
            Verified HTU Staff Trust System
          </div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Supporting Our Dedicated <br className="hidden md:inline" />
            Academic &amp; Administrative Staff
          </h2>

          <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto leading-relaxed">
            The official welfare portal of Ho Technical University, Accra-Keta Highway, Ho. 
            Providing financial assistance, medical scheme claims, and zero-interest loans.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button 
              onClick={onEnterPortal}
              className="w-full sm:w-auto btn btn-gold px-8 py-3.5 text-xs font-bold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
            >
              Sign In to Your Account <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#benefits"
              className="w-full sm:w-auto text-center border border-white/20 hover:border-white/50 text-white px-8 py-3.5 rounded-xl text-xs font-bold transition-colors"
            >
              Learn More
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-16 pt-10 border-t border-white/10 text-center">
            <div>
              <span className="text-2xl md:text-3xl font-extrabold text-gold block">GH₵1.2M+</span>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Reserve Fund Balance</span>
            </div>
            <div>
              <span className="text-2xl md:text-3xl font-extrabold text-gold block">1,840+</span>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Active Staff Members</span>
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="text-2xl md:text-3xl font-extrabold text-gold block">GH₵485K+</span>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Total Claims Paid</span>
            </div>
          </div>
        </div>
      </section>

      {/* CORE WELFARE BENEFITS */}
      <section id="benefits" className="py-20 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-gold uppercase tracking-wider">Entitlements</span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-navy">Welfare Benefit Categories</h3>
          <p className="text-xs text-text-3 font-semibold leading-relaxed">
            HTU staff are entitled to payouts and allowances under the scheme guidelines for major life milestones.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="card p-6 border border-border/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-red-pale text-red rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-deep">Critical Illness Support</h4>
              <p className="text-xs text-text-2 leading-relaxed">
                Direct financial grant to offset urgent medical treatments and hospitalizations. A Medical Board Certificate is required for validation.
              </p>
            </div>
            <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-text-3 font-bold uppercase">Max Coverage</span>
              <span className="text-sm font-extrabold text-navy">Up to GH₵ 6,000</span>
            </div>
          </div>

          <div className="card p-6 border border-border/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-gold-pale text-gold rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-deep">Retirement Packages</h4>
              <p className="text-xs text-text-2 leading-relaxed">
                Lump-sum disbursement awarded to members upon successful retirement from service as an appreciation for contributions.
              </p>
            </div>
            <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-text-3 font-bold uppercase">Disbursement</span>
              <span className="text-sm font-extrabold text-navy">Up to GH₵ 4,000</span>
            </div>
          </div>

          <div className="card p-6 border border-border/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-blue-pale text-blue rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-navy-deep">Bereavement Aids</h4>
              <p className="text-xs text-text-2 leading-relaxed">
                Condolence supports issued upon the passing of a member, nominated spouse, child, or biological parents.
              </p>
            </div>
            <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-text-3 font-bold uppercase">Bereavement cover</span>
              <span className="text-sm font-extrabold text-navy">Up to GH₵ 6,000</span>
            </div>
          </div>
        </div>
      </section>

      {/* LOAN INFO SECTION */}
      <section id="loans" className="py-20 bg-white border-y border-border/40">
        <div className="max-w-5xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold-pale rounded-full text-xs font-bold text-gold">
              <Landmark className="w-4 h-4" /> Zero-Interest Rates
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-navy">Emergency Loan Facilities</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              Our scheme provides instant interest-free credit advances for active staff members facing house repairs, urgent family expenses, or emergency car services.
            </p>
            
            <ul className="text-xs text-text-2 font-semibold space-y-3">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-green" /> Flexible repayment limits from 2 to 6 months
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-green" /> Direct salary source deductions with no interest fee
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-green" /> Approved and disbursed directly within 24 hours
              </li>
            </ul>

            <div className="pt-2">
              <button 
                onClick={onEnterPortal}
                className="btn btn-gold text-xs font-bold px-6 py-3"
              >
                Apply for Loan
              </button>
            </div>
          </div>

          <div className="bg-cream border border-border/40 rounded-3xl p-6 md:p-8 space-y-4">
            <h4 className="text-navy-deep font-bold text-sm uppercase tracking-wider border-b border-border/40 pb-2">Loan Tier Rules</h4>
            <div className="flex justify-between items-center py-2 border-b border-border/20">
              <span className="text-xs text-text-3 font-semibold">Maximum Borrow Limit</span>
              <span className="text-xs font-extrabold text-navy">GH₵ 1,500</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/20">
              <span className="text-xs text-text-3 font-semibold">Repayment Method</span>
              <span className="text-xs font-extrabold text-navy">Salary Deduction</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-text-3 font-semibold">Interest Rate Fee</span>
              <span className="text-xs font-extrabold text-green bg-green-pale px-2 py-0.5 rounded">0% (Interest Free)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY RULES */}
      <section id="rules" className="py-20 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <h3 className="text-2xl font-extrabold text-navy">Membership &amp; Eligibility Guidelines</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              To remain fully compliant and eligible for welfare payouts, all members must adhere to the Board Constitution requirements:
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-navy-mid/10 text-navy-deep flex items-center justify-center flex-shrink-0 font-bold text-xs">1</div>
                <div>
                  <h4 className="text-xs font-bold text-navy-deep">Monthly Contributions Dues</h4>
                  <p className="text-[11px] text-text-2 leading-relaxed mt-0.5">Every member makes a standard contribution of <strong>GH₵ 25.00</strong> monthly to maintain active registry standing.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-navy-mid/10 text-navy-deep flex items-center justify-center flex-shrink-0 font-bold text-xs">2</div>
                <div>
                  <h4 className="text-xs font-bold text-navy-deep">Eligibility Threshold</h4>
                  <p className="text-[11px] text-text-2 leading-relaxed mt-0.5">Members must contribute for at least <strong>6 consecutive months</strong> to qualify for Critical Illness or Retirement support packages.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-navy-mid/10 text-navy-deep flex items-center justify-center flex-shrink-0 font-bold text-xs">3</div>
                <div>
                  <h4 className="text-xs font-bold text-navy-deep">Dependents Verification</h4>
                  <p className="text-[11px] text-text-2 leading-relaxed mt-0.5">Spouses and nominated biological parents must be verified and registered under the profile registry settings prior to filing a claim.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 border border-border/40 bg-gradient-to-br from-navy to-[#18284c] text-white">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-gold" />
              <h4 className="font-extrabold text-sm uppercase text-gold tracking-wide">Welfare Constitution</h4>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Approved and ratified by the Ho Technical University Welfare Scheme Executive Board and academic unions (TUTAG, TUSAAG, TEWU, TUWAG, TUAAG).
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-6 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Registry standing:</span>
                <span className="font-bold text-green">Online</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2">
                <span className="text-white/60">Latest Amendments:</span>
                <span className="font-bold text-white">June 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy-deep text-white/60 border-t border-white/5 py-12 px-6 md:px-12 mt-auto text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <HTULogo className="w-12 h-12" />
            <div>
              <h4 className="font-extrabold text-white text-sm">Ho Technical University</h4>
              <p className="text-[10px] text-white/50">Staff Welfare Scheme Secretariat Office</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p>&copy; 2026 HTU Staff Welfare Scheme. All rights reserved.</p>
            <p className="text-[10px] text-white/30">Accra-Keta Highway, Ho, Volta Region, Ghana. Registered Administration System.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
