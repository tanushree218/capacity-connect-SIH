import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Users, BookOpen, Award, TrendingUp, GraduationCap, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/analytics/admin-overview").then((r) => setData(r.data)); }, []);

  if (!data) return <Layout><div className="p-8 text-slate-500">Loading analytics...</div></Layout>;

  const trainingData = [
    { name: "Completed", value: data.completed, color: "#10b981" },
    { name: "In Progress", value: data.in_progress, color: "#008DDA" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Administrator Console</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">Organizational Overview</h1>
          <p className="text-slate-600 mt-1">Real-time capability metrics across MoES.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { l: "Total Employees", v: data.total_employees, icon: Users, c: "text-[#008DDA]" },
            { l: "Active Learners", v: data.active_learners, icon: GraduationCap, c: "text-[#1E3E62]" },
            { l: "Courses", v: data.total_courses, icon: BookOpen, c: "text-[#0B192C]" },
            { l: "Completion Rate", v: `${data.completion_rate}%`, icon: TrendingUp, c: "text-emerald-600" },
            { l: "Certificates", v: data.certificates, icon: Award, c: "text-[#D4AF37]" },
          ].map((s) => (
            <Card key={s.l} className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">{s.l}</div>
                <s.icon size={16} className={s.c} />
              </div>
              <div className="font-display font-extrabold text-3xl text-[#0B192C] mt-2">{s.v}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="font-display font-bold text-lg text-[#0B192C] mb-4">Department-wise Competency Score</h2>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={data.department_scores} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#008DDA" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display font-bold text-lg text-[#0B192C] mb-4">Training Participation</h2>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={trainingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {trainingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white">
          <div className="flex items-start gap-4">
            <CheckCircle2 size={28} className="text-[#D4AF37] shrink-0 mt-1" />
            <div>
              <div className="font-display font-bold text-xl">Next-generation capability intelligence</div>
              <div className="text-slate-300 mt-1 text-sm">Head to the Competency Gap Dashboard to identify high-priority skill deficits and assign targeted training.</div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
