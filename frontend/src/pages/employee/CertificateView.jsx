import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Shield, Award, Printer } from "lucide-react";

export default function CertificateView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const verifyUrl = `${window.location.origin}/verify/${id}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verifyUrl)}`;

  useEffect(() => { api.get(`/certificates/verify/${id}`).then((r) => setData(r.data)); }, [id]);

  if (!data) return <div className="p-10 text-slate-500">Loading...</div>;
  if (!data.valid) return <div className="p-10 text-rose-600 text-center">Certificate not found.</div>;
  const c = data.certificate;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <a href="/" className="text-sm text-slate-600 hover:underline">← Back</a>
        <Button onClick={() => window.print()} className="bg-[#0B192C]" data-testid="print-cert"><Printer size={14} className="mr-2" /> Print / Save PDF</Button>
      </div>

      <div className="cert-container max-w-4xl mx-auto rounded-xl p-10 sm:p-14 relative" data-testid="certificate-view">
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-[#0B192C]" />
            <div>
              <div className="font-display font-extrabold text-[#0B192C] text-sm">MINISTRY OF EARTH SCIENCES</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-600">Government of India</div>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center">
            <Award size={24} className="text-[#D4AF37]" />
          </div>
        </div>

        <div className="text-center mt-20 sm:mt-24">
          <div className="text-xs uppercase tracking-[0.4em] text-slate-500 font-bold">Certificate of Completion</div>
          <div className="mt-6 text-sm text-slate-600">This is to certify that</div>
          <div className="mt-4 font-display font-extrabold text-3xl sm:text-4xl text-[#0B192C] tracking-tight">{c.employee_name}</div>
          <div className="mt-4 text-sm text-slate-600 max-w-2xl mx-auto">has successfully completed the CAPACITY CONNECT training programme</div>
          <div className="mt-3 font-display font-bold text-xl sm:text-2xl text-[#1E3E62]">"{c.course_title}"</div>
          <div className="mt-5 text-sm text-slate-600">with a final assessment score of <span className="font-bold text-emerald-700">{c.score}%</span></div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row justify-between items-end gap-6">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">Certificate ID</div>
            <div className="font-mono font-bold text-[#0B192C]">{c.certificate_id}</div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mt-3">Issued On</div>
            <div className="font-semibold text-[#0B192C]">{new Date(c.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="text-center">
            <img src={qrSrc} alt="QR Verify" className="w-32 h-32 border border-slate-300" />
            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Scan to Verify</div>
          </div>
          <div className="text-right">
            <div className="border-t-2 border-[#0B192C] pt-1 min-w-[180px] text-right">
              <div className="font-display font-bold text-sm text-[#0B192C]">Chief Administrator</div>
              <div className="text-xs text-slate-500">CAPACITY CONNECT · MoES</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
