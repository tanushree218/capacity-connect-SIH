import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Target, BookOpen, Award, TrendingUp, Sparkles } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="tri-accent h-1" />
      <header className="bg-[#0B192C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#008DDA] to-[#1E3E62] flex items-center justify-center border border-[#D4AF37]/50">
              <Shield size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <div className="font-display font-bold text-lg tracking-tight">CAPACITY CONNECT</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Ministry of Earth Sciences · Govt. of India</div>
            </div>
          </div>
          <Button onClick={() => navigate("/login")} className="bg-[#008DDA] hover:bg-[#0077BC] text-white" data-testid="landing-signin-btn">
            Sign in
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B192C] text-white text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              SIH 2026 · Problem Statement #26075
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B192C] leading-[1.05]">
              Workforce capability,<br /><span className="text-[#008DDA]">measured & closed.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              A centralized digital capacity-building platform for the Ministry of Earth Sciences.
              Map competencies, identify skill gaps, recommend targeted training, and grow organizational capability with precision.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/login")} className="bg-[#0B192C] hover:bg-[#1E3E62] text-white" data-testid="landing-get-started">
                Sign in to portal
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="border-[#0B192C] text-[#0B192C]" data-testid="landing-demo">
                Try demo accounts
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[{n:"5,000+",l:"Employees"},{n:"86",l:"Courses"},{n:"74%",l:"Completion"}].map((s) => (
                <div key={s.l} className="border-l-2 border-[#008DDA] pl-3">
                  <div className="font-display font-extrabold text-2xl text-[#0B192C]">{s.n}</div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <img src="https://images.unsplash.com/photo-1708738793054-32b71e3fc822?w=1200" alt="Earth observation" className="w-full h-[420px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Killer Feature</div>
                <div className="font-display font-bold text-xl">Competency Gap Analytics</div>
                <div className="text-sm text-slate-200 mt-1">Real-time skill-gap intelligence across every department.</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-56 hidden sm:block">
              <div className="text-xs uppercase tracking-widest text-slate-500">Ocean Modelling</div>
              <div className="flex items-center justify-between mt-1">
                <div className="font-display font-bold text-2xl text-[#0B192C]">HIGH</div>
                <div className="text-rose-600 font-bold">42%</div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "42%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold mb-2">Five integrated layers</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0B192C]">Beyond a traditional LMS.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Target, t: "Competency Gap Analytics", d: "Identify Required − Current skill gaps across every department." },
            { icon: Sparkles, t: "AI Learning Pathways", d: "Personalized training routes powered by Claude Sonnet 4.6." },
            { icon: BookOpen, t: "Learning Management", d: "Courses with videos, PDFs, and auto-graded assessments." },
            { icon: Award, t: "Verified Certificates", d: "QR-verifiable certificates on successful course completion." },
            { icon: TrendingUp, t: "Organizational Dashboards", d: "Department-wise capability, completion & progress metrics." },
            { icon: Shield, t: "Role-Based Access", d: "Admin, Trainer & Employee flows with secure JWT auth." },
          ].map((f) => (
            <div key={f.t} className="p-6 rounded-xl border border-slate-200 bg-white card-hover">
              <div className="w-10 h-10 rounded-md bg-[#0B192C] text-[#D4AF37] flex items-center justify-center mb-4">
                <f.icon size={18} />
              </div>
              <div className="font-display font-bold text-lg text-[#0B192C]">{f.t}</div>
              <div className="text-sm text-slate-600 mt-1">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#0B192C] text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between gap-3">
          <div>© {new Date().getFullYear()} CAPACITY CONNECT · SIH26075 Prototype</div>
          <div>Powered by Claude Sonnet 4.6 · FastAPI · React</div>
        </div>
      </footer>
    </div>
  );
}
