import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BookOpen, Award, Target, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [enrolls, setEnrolls] = useState([]);
  const [certs, setCerts] = useState([]);
  const [recs, setRecs] = useState([]);
  const [comp, setComp] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    api.get("/analytics/employee-dashboard")
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        setEnrolls(data.enrollments || []);
        setCerts(data.certificates || []);
        setRecs(data.recommendations || []);
        setComp(data.competency || null);
        setStats(data.stats || null);
      })
      .catch(() => {
        if (isMounted) {
          setError("Your learning dashboard could not be loaded. Please try again shortly.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const assigned = stats?.assigned ?? enrolls.length;
  const completed = stats?.completed
    ?? enrolls.filter((enrollment) => enrollment.status === "completed").length;
  const avgProg = stats?.average_progress
    ?? (assigned
      ? Math.round(
        enrolls.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0) / assigned
      )
      : 0);
  const compScore = comp ? (() => {
    const rows = comp.profile.filter((p) => p.required_level > 0);
    if (!rows.length) return 0;
    return Math.round(rows.reduce((s, p) => s + Math.min(100, 100 * p.current_level / p.required_level), 0) / rows.length);
  })() : (stats?.competency_score ?? 0);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Welcome back</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0B192C]">Hello, {user?.name?.split(" ")[0]}.</h1>
          <p className="text-slate-600 mt-1">Your personalized capability journey.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { l: "Assigned", v: assigned, icon: BookOpen, c: "text-[#008DDA]" },
            { l: "Completed", v: completed, icon: TrendingUp, c: "text-emerald-600" },
            { l: "Certificates", v: certs.length, icon: Award, c: "text-[#D4AF37]" },
            { l: "Progress", v: `${avgProg}%`, icon: Target, c: "text-[#1E3E62]" },
            { l: "Competency", v: `${compScore}%`, icon: Sparkles, c: "text-rose-600" },
          ].map((s) => (
            <Card
              key={s.l}
              className="p-5"
              data-testid={`employee-stat-${s.l.toLowerCase()}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">{s.l}</div>
                <s.icon size={16} className={s.c} />
              </div>
              <div className="font-display font-extrabold text-3xl text-[#0B192C] mt-2">{s.v}</div>
            </Card>
          ))}
        </div>

        {error && (
          <Card
            className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            data-testid="employee-dashboard-error"
          >
            {error}
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold text-[#0B192C]">Assigned Courses</h2>
              <Link
                to="/catalog"
                className="text-xs uppercase tracking-widest text-[#008DDA] font-bold"
                data-testid="employee-dashboard-browse-catalog-link"
              >
                Browse catalog →
              </Link>
            </div>
            {enrolls.length === 0 && (
              <Card className="p-8 text-center text-slate-500">
                No courses assigned yet. {" "}
                <Link
                  to="/catalog"
                  className="text-[#008DDA] font-semibold"
                  data-testid="employee-dashboard-empty-catalog-link"
                >
                  Browse the catalog
                </Link>.
              </Card>
            )}
            {enrolls.map((e) => (
              <Card key={e.id} className="p-5 card-hover" data-testid={`enrolled-${e.course_id}`}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <img src={e.course?.thumbnail} alt="" className="w-full sm:w-32 h-24 object-cover rounded-md" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-display font-bold text-lg text-[#0B192C]">{e.course?.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{e.course?.duration_hours}h · {e.course?.level}</div>
                      </div>
                      <Badge variant="outline" className={
                        e.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        e.status === "assigned" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }>{e.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1"><span>Progress</span><span className="font-semibold">{Math.round(e.progress || 0)}%</span></div>
                      <Progress value={e.progress || 0} />
                    </div>
                    <Link to={`/course/${e.course_id}`}>
                      <Button variant="outline" size="sm" className="mt-3" data-testid={`open-course-${e.course_id}`}>
                        Continue <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold text-[#0B192C]">Recommended for you</h2>
            </div>
            <Card className="p-4 bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white">
              <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm mb-2"><Sparkles size={14} /> AI Capability Matcher</div>
              <div className="text-xs text-slate-300">Recommendations powered by competency-gap analysis.</div>
            </Card>
            {recs.length === 0 && (
              <Card className="p-5 text-sm text-slate-500 text-center">All your competencies meet requirements 🎯</Card>
            )}
            {recs.map((r) => (
              <Card key={r.course.id} className="p-4 card-hover" data-testid={`rec-${r.course.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-[#0B192C] text-sm">{r.course.title}</div>
                  <Badge className={r.priority === "HIGH" ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-700 border-amber-200"} variant="outline">{r.priority}</Badge>
                </div>
                <div className="text-xs text-slate-600 mt-2">{r.reason}</div>
                <Link to={`/course/${r.course.id}`}>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 text-[#008DDA]"
                    data-testid={`view-recommended-course-${r.course.id}`}
                  >
                    View course →
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
