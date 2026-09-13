import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/Layout";
import { Sparkles, Loader2 } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { toast } from "sonner";

export default function CompetencyProfile() {
  const [data, setData] = useState(null);
  const [goal, setGoal] = useState("Become an Advanced Data Analyst at MoES");
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/competencies/me").then((r) => setData(r.data));
  }, []);

  const generatePath = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/ai/learning-path", { goal });
      setPath(data.learning_path);
      if (data.fallback) toast.info("Using rule-based fallback recommendations");
      else toast.success("Learning path generated");
    } catch { toast.error("Failed to generate path"); }
    finally { setLoading(false); }
  };

  if (!data) return <Layout><div className="p-8 text-slate-500">Loading...</div></Layout>;

  const chartData = data.profile.map((p) => ({
    subject: p.competency.name,
    Current: p.current_level,
    Required: p.required_level,
    fullMark: 4,
  }));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Personal Profile</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">Competency Profile</h1>
          <p className="text-slate-600 mt-1">{data.employee.name} · {data.employee.department}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-display font-bold text-lg text-[#0B192C] mb-4">Current vs Required</h2>
            <div className="h-80">
              <ResponsiveContainer>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#475569" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fontSize: 10 }} />
                  <Radar name="Required" dataKey="Required" stroke="#0B192C" fill="#0B192C" fillOpacity={0.1} />
                  <Radar name="Current" dataKey="Current" stroke="#008DDA" fill="#008DDA" fillOpacity={0.35} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm mb-2"><Sparkles size={14} /> AI Learning Path</div>
            <div className="text-xs text-slate-500 mb-3">Powered by Claude Sonnet 4.6</div>
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder="Enter your goal..." data-testid="goal-input" />
            <Button onClick={generatePath} disabled={loading} className="mt-3 w-full bg-[#0B192C] hover:bg-[#1E3E62]" data-testid="generate-path-btn">
              {loading ? <><Loader2 size={14} className="animate-spin mr-2" /> Generating...</> : "Generate my path"}
            </Button>
            {path && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto" data-testid="learning-path-output">
                {path}
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="font-display font-bold text-xl text-[#0B192C] mb-3">Detailed Breakdown</h2>
          <div className="grid gap-3">
            {data.profile.map((p) => (
              <Card key={p.competency.id} className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between" data-testid={`comp-${p.competency.id}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0B192C]">{p.competency.name}</span>
                    <span className="text-xs text-slate-500 uppercase">{p.competency.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.competency.description}</div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div><div className="text-xs text-slate-500">Current</div><div className="font-display font-bold text-lg">L{p.current_level}</div></div>
                  <div><div className="text-xs text-slate-500">Required</div><div className="font-display font-bold text-lg">L{p.required_level}</div></div>
                  <div><div className="text-xs text-slate-500">Gap</div><div className="font-display font-bold text-lg">{p.gap}</div></div>
                  <StatusBadge status={p.status} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
