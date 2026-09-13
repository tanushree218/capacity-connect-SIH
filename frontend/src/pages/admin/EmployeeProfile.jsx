import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/Layout";

export default function EmployeeProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/competencies/profile/${id}`).then((r) => setData(r.data)); }, [id]);

  if (!data) return <Layout><div className="p-8 text-slate-500">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Employee Profile</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">{data.employee.name}</h1>
          <p className="text-slate-600 mt-1">{data.employee.designation} · {data.employee.department}</p>
        </div>
        <div className="grid gap-3">
          {data.profile.map((p) => (
            <Card key={p.competency.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold text-[#0B192C]">{p.competency.name}</div>
                <div className="text-xs text-slate-500">{p.competency.type}</div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div><div className="text-xs text-slate-500">Current</div><div className="font-display font-bold">L{p.current_level}</div></div>
                <div><div className="text-xs text-slate-500">Required</div><div className="font-display font-bold">L{p.required_level}</div></div>
                <div><div className="text-xs text-slate-500">Gap</div><div className="font-display font-bold">{p.gap}</div></div>
                <StatusBadge status={p.status} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
