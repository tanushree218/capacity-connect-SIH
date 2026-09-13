import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const DEMO = [
  { role: "Admin", email: "admin@moes.gov.in" },
  { role: "Trainer", email: "trainer@moes.gov.in" },
  { role: "Employee (Rahul)", email: "rahul@moes.gov.in" },
  { role: "Employee (Priya)", email: "priya@moes.gov.in" },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome, ${u.name}`);
      const dest = u.role === "admin" ? "/admin" : u.role === "trainer" ? "/trainer" : "/dashboard";
      nav(dest);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  const quick = async (e) => {
    setEmail(e); setPassword("moes2026");
    setLoading(true);
    try {
      const u = await login(e, "moes2026");
      const dest = u.role === "admin" ? "/admin" : u.role === "trainer" ? "/trainer" : "/dashboard";
      nav(dest);
    } catch (err) { toast.error("Login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-[#0B192C]">
        <img src="https://images.unsplash.com/photo-1743660236233-9ce45485dca7?w=1200" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B192C] via-[#0B192C]/80 to-[#1E3E62]/60" />
        <div className="relative z-10 h-full flex flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-gradient-to-br from-[#008DDA] to-[#1E3E62] flex items-center justify-center border border-[#D4AF37]/50">
              <Shield size={22} className="text-[#D4AF37]" />
            </div>
            <div>
              <div className="font-display font-bold text-lg">CAPACITY CONNECT</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Ministry of Earth Sciences · Govt. of India</div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[#D4AF37] mb-2">SIH26075</div>
            <h2 className="font-display text-4xl font-extrabold leading-tight">Grow the capability of India's earth-science workforce.</h2>
            <p className="mt-4 text-slate-300 max-w-md">Map competencies. Identify gaps. Recommend precise training. Certify outcomes.</p>
          </div>
          <div className="text-xs text-slate-500">© {new Date().getFullYear()} MoES · SIH Prototype</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 text-center">
            <div className="font-display font-bold text-2xl text-[#0B192C]">CAPACITY CONNECT</div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Ministry of Earth Sciences</div>
          </div>
          <Card className="p-6 sm:p-8 shadow-xl border-slate-200">
            <h1 className="font-display text-2xl font-bold text-[#0B192C]">Sign in</h1>
            <p className="text-sm text-slate-600 mt-1">Access your capability portal.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Official Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@moes.gov.in" required data-testid="login-email" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#0B192C] hover:bg-[#1E3E62]" data-testid="login-submit">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">SIH Demo · Quick Sign-in</div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO.map((d) => (
                  <Button
                    key={d.email}
                    variant="outline"
                    size="sm"
                    onClick={() => quick(d.email)}
                    className="text-xs justify-start border-slate-300"
                    data-testid={`quick-${d.email.replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    {d.role}
                  </Button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mt-3">Password for all demo accounts: <span className="font-mono font-semibold">moes2026</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
