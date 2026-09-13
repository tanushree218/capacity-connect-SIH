import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Clock, User } from "lucide-react";

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/courses").then((r) => setCourses(r.data));
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(q.toLowerCase()) ||
    c.description.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Learning Library</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">Course Catalog</h1>
          <p className="text-slate-600 mt-1">Browse all training available at MoES.</p>
        </div>

        <Input placeholder="Search courses..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" data-testid="course-search" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <Link to={`/course/${c.id}`} key={c.id} data-testid={`catalog-${c.id}`}>
              <Card className="overflow-hidden card-hover h-full">
                <img src={c.thumbnail} alt="" className="w-full h-40 object-cover" />
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><Clock size={12} /> {c.duration_hours}h</span>
                    <Badge variant="outline">{c.level}</Badge>
                  </div>
                  <div className="font-display font-bold text-lg text-[#0B192C]">{c.title}</div>
                  <div className="text-sm text-slate-600 mt-2 line-clamp-2">{c.description}</div>
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-slate-500">
                    <User size={12} /> {c.trainer_name}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
