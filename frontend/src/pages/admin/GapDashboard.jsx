import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const PRIORITY_COLOR = { HIGH: "#e11d48", MED: "#f59e0b", LOW: "#10b981" };
const PRIORITY_BG = {
  HIGH: "bg-rose-50 text-rose-700 border-rose-200",
  MED: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function GapDashboard() {
  const [dept, setDept] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [resolveGap, setResolveGap] = useState(null);
  const [selCourse, setSelCourse] = useState("");
  const [selEmps, setSelEmps] = useState([]);

  const load = () => {
    const q = dept === "all" ? "" : `?department=${encodeURIComponent(dept)}`;
    api.get(`/analytics/gap-dashboard${q}`).then((r) => setData(r.data));
  };

  useEffect(() => {
    api.get("/departments").then((r) => setDepartments(r.data));
    api.get("/courses").then((r) => setCourses(r.data));
    api.get("/users?role=employee").then((r) => setEmployees(r.data));
  }, []);
  useEffect(load, [dept]);

  const filteredEmps = dept === "all" ? employees : employees.filter((e) => e.department === dept);

  const suggestCourse = (comp) => {
    return courses.find((c) => c.competency_map?.some((cm) => cm.competency_id === comp.id));
  };

  const assign = async () => {
    if (!selCourse || !selEmps.length) { toast.error("Pick course and employees"); return; }
    await api.post("/enrollments/assign", { course_id: selCourse, employee_ids: selEmps });
    toast.success(`Assigned to ${selEmps.length} employees`);
    setResolveGap(null); setSelCourse(""); setSelEmps([]);
    load();
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-wrap gap-4 justify-between items-end">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">Killer Feature · SIH Differentiator</div>
            <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">Competency Gap Dashboard</h1>
            <p className="text-slate-600 mt-1">Prioritize training investment where it matters most.</p>
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-56 bg-white" data-testid="dept-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {data && (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="p-5 bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white">
                <div className="text-xs uppercase tracking-widest text-[#D4AF37]">Employees in scope</div>
                <div className="font-display font-extrabold text-3xl mt-1">{data.total_employees}</div>
              </Card>
              <Card className="p-5">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">High priority gaps</div>
                <div className="font-display font-extrabold text-3xl text-rose-600 mt-1">{data.gaps.filter((g) => g.priority === "HIGH").length}</div>
              </Card>
              <Card className="p-5">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Medium gaps</div>
                <div className="font-display font-extrabold text-3xl text-amber-600 mt-1">{data.gaps.filter((g) => g.priority === "MED").length}</div>
              </Card>
            </div>

            <Card className="p-5">
              <h2 className="font-display font-bold text-lg text-[#0B192C] mb-4">Top Competency Gaps</h2>
              <div className="h-80">
                <ResponsiveContainer>
                  <BarChart data={data.gaps.slice(0, 8)} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="competency.name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={70} />
                    <YAxis label={{ value: '% affected', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="affected_pct" radius={[6, 6, 0, 0]}>
                      {data.gaps.map((g, i) => <Cell key={i} fill={PRIORITY_COLOR[g.priority]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-display font-bold text-lg text-[#0B192C] mb-4">Recommended Organizational Actions</h2>
              <div className="space-y-3">
                {data.gaps.map((g) => {
                  const rec = suggestCourse(g.competency);
                  return (
                    <div key={g.competency.id} className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border border-slate-200 hover:border-[#008DDA] transition" data-testid={`gap-${g.competency.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-[#0B192C]">{g.competency.name}</span>
                          <Badge variant="outline" className={PRIORITY_BG[g.priority]}>{g.priority}</Badge>
                          <span className="text-xs text-slate-500">{g.competency.type}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          <Users size={11} className="inline mr-1" /> {g.affected_count} employees affected · {g.affected_pct}% of scope · Avg current L{g.avg_current_level}
                        </div>
                        {rec && <div className="text-xs text-slate-500 mt-1">Recommended: <span className="font-semibold text-[#008DDA]">{rec.title}</span></div>}
                      </div>
                      {rec && (
                        <Button variant="outline" size="sm" onClick={() => { setResolveGap(g); setSelCourse(rec.id); setSelEmps([]); }} className="border-[#0B192C] text-[#0B192C]" data-testid={`resolve-${g.competency.id}`}>
                          <Sparkles size={14} className="mr-1" /> Resolve Gap
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        <Dialog open={!!resolveGap} onOpenChange={(o) => !o && setResolveGap(null)}>
          <DialogContent className="max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="font-display">Assign Training to Close Gap</DialogTitle>
            </DialogHeader>
            {resolveGap && (
              <div className="space-y-4">
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-sm">
                  <div className="font-semibold text-rose-700 flex items-center gap-2"><AlertTriangle size={14} /> {resolveGap.competency.name} — {resolveGap.priority}</div>
                  <div className="text-xs text-slate-600 mt-1">{resolveGap.affected_count} employees need training</div>
                </div>
                <div>
                  <Label>Course</Label>
                  <Select value={selCourse} onValueChange={setSelCourse}>
                    <SelectTrigger data-testid="assign-course-select"><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.filter((c) => c.competency_map?.some((cm) => cm.competency_id === resolveGap.competency.id)).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign to employees</Label>
                  <div className="max-h-52 overflow-y-auto border rounded-md p-2 mt-1 space-y-1">
                    {filteredEmps.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 py-1">
                        <Checkbox id={`emp-${e.id}`} checked={selEmps.includes(e.id)} onCheckedChange={(v) => setSelEmps(v ? [...selEmps, e.id] : selEmps.filter((x) => x !== e.id))} data-testid={`assign-emp-${e.id}`} />
                        <Label htmlFor={`emp-${e.id}`} className="cursor-pointer text-sm">{e.name} <span className="text-xs text-slate-500">· {e.department}</span></Label>
                      </div>
                    ))}
                  </div>
                  <button className="text-xs text-[#008DDA] mt-1" onClick={() => setSelEmps(filteredEmps.map((e) => e.id))}>Select all</button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={assign} className="bg-[#0B192C] hover:bg-[#1E3E62]" data-testid="confirm-assign">Assign Training</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
