import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  useEffect(() => { api.get("/courses").then((r) => setCourses(r.data)); }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Learning Content</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">All Courses</h1>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <Link to={`/course/${c.id}`} key={c.id}>
              <Card className="overflow-hidden card-hover h-full">
                <img src={c.thumbnail} alt="" className="w-full h-32 object-cover" />
                <div className="p-4">
                  <Badge variant="outline">{c.level}</Badge>
                  <div className="font-display font-bold text-[#0B192C] mt-2">{c.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{c.duration_hours}h · {c.modules?.length || 0} modules · {c.quiz?.length || 0} questions</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
