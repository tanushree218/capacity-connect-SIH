import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Shield } from "lucide-react";

export default function VerifyCertificate() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/certificates/verify/${id}`).then((r) => setData(r.data)); }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-4"><Shield size={40} className="text-[#0B192C]" /></div>
        <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Certificate Verification</div>
        <div className="font-display font-bold text-xl text-[#0B192C] mt-1">CAPACITY CONNECT · MoES</div>
        {!data && <div className="mt-6 text-slate-500">Verifying...</div>}
        {data && data.valid && (
          <div className="mt-6" data-testid="verify-valid">
            <div className="flex justify-center"><CheckCircle2 size={48} className="text-emerald-600" /></div>
            <div className="font-display font-bold text-2xl mt-3 text-emerald-700">Valid Certificate</div>
            <div className="mt-4 text-sm text-slate-700">
              <div><span className="text-slate-500">Awarded to:</span> <span className="font-semibold">{data.certificate.employee_name}</span></div>
              <div className="mt-1"><span className="text-slate-500">Course:</span> <span className="font-semibold">{data.certificate.course_title}</span></div>
              <div className="mt-1"><span className="text-slate-500">Score:</span> <span className="font-semibold text-emerald-700">{data.certificate.score}%</span></div>
              <div className="mt-1"><span className="text-slate-500">Issued:</span> <span className="font-semibold">{new Date(data.certificate.issued_at).toLocaleDateString('en-IN')}</span></div>
              <div className="mt-1"><span className="text-slate-500">ID:</span> <span className="font-mono">{data.certificate.certificate_id}</span></div>
            </div>
          </div>
        )}
        {data && !data.valid && (
          <div className="mt-6" data-testid="verify-invalid">
            <div className="flex justify-center"><XCircle size={48} className="text-rose-600" /></div>
            <div className="font-display font-bold text-2xl mt-3 text-rose-700">Not Found</div>
            <div className="text-sm text-slate-600 mt-2">This certificate ID is not in our records.</div>
          </div>
        )}
      </Card>
    </div>
  );
}
