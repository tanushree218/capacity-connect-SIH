import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Award } from "lucide-react";

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  useEffect(() => { api.get("/courses").then((r) => setCourses(r.data.filter((c) => c.trainer_id === user?.id))); }, [user]);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Trainer Console</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">Welcome, {user?.name}</h1>
          <p className="text-slate-600 mt-1">Manage your courses and content.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-5"><div className="flex justify-between"><div className="text-xs uppercase tracking-widest text-slate-500 font-bold">My Courses</div><BookOpen size={16} className="text-[#008DDA]" /></div><div className="font-display font-extrabold text-3xl text-[#0B192C] mt-2">{courses.length}</div></Card>
          <Card className="p-5"><div className="flex justify-between"><div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Total Modules</div><Users size={16} className="text-[#1E3E62]" /></div><div className="font-display font-extrabold text-3xl text-[#0B192C] mt-2">{courses.reduce((s, c) => s + (c.modules?.length || 0), 0)}</div></Card>
          <Card className="p-5"><div className="flex justify-between"><div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Assessments</div><Award size={16} className="text-[#D4AF37]" /></div><div className="font-display font-extrabold text-3xl text-[#0B192C] mt-2">{courses.reduce((s, c) => s + (c.quiz?.length || 0), 0)}</div></Card>
        </div>

        <div>
          <h2 className="font-display font-bold text-xl text-[#0B192C] mb-3">My Courses</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <Link to={`/course/${c.id}`} key={c.id}>
                <Card className="overflow-hidden card-hover">
                  <img src={c.thumbnail} alt="" className="w-full h-32 object-cover" />
                  <div className="p-4">
                    <Badge variant="outline">{c.level}</Badge>
                    <div className="font-display font-bold text-[#0B192C] mt-2">{c.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{c.modules?.length} modules · {c.quiz?.length} questions</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
