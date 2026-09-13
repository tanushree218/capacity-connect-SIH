import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Award } from "lucide-react";
import { Link } from "react-router-dom";

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  useEffect(() => { api.get("/certificates/me").then((r) => setCerts(r.data)); }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Awards & Recognition</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">My Certificates</h1>
        </div>
        {certs.length === 0 && (
          <Card className="p-10 text-center text-slate-500">
            No certificates yet. Complete a course assessment to earn one.
          </Card>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certs.map((c) => (
            <Link to={`/certificate/${c.certificate_id}`} key={c.id} data-testid={`cert-${c.certificate_id}`}>
              <Card className="p-5 card-hover border-l-4 border-[#D4AF37]">
                <div className="flex items-center gap-2 text-[#D4AF37] mb-3"><Award size={20} /> <span className="font-bold text-xs uppercase tracking-widest">Certificate</span></div>
                <div className="font-display font-bold text-lg text-[#0B192C]">{c.course_title}</div>
                <div className="text-xs text-slate-500 mt-2">ID: <span className="font-mono">{c.certificate_id}</span></div>
                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                  <span className="text-slate-500">Score</span>
                  <span className="font-bold text-emerald-700">{c.score}%</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">Issued</span>
                  <span className="font-semibold">{new Date(c.issued_at).toLocaleDateString()}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
