import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateCourse() {
  const nav = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", duration_hours: 4, level: "Intermediate" });
  const [modules, setModules] = useState([{ title: "", type: "video", content: "" }]);
  const [quiz, setQuiz] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [maps, setMaps] = useState([{ competency_id: "", from_level: 0, to_level: 1 }]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [gen, setGen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/competencies").then((r) => setCompetencies(r.data)); }, []);

  const generateQuiz = async () => {
    if (!aiTopic) { toast.error("Enter a topic"); return; }
    setGen(true);
    try {
      const { data } = await api.post("/ai/generate-quiz", { topic: aiTopic, content: aiContent, n: 5 });
      if (data.quiz && data.quiz.length) {
        setQuiz([...quiz, ...data.quiz]);
        toast.success(`Generated ${data.quiz.length} questions`);
      } else toast.error("Failed to parse quiz");
    } catch { toast.error("AI generation failed"); }
    finally { setGen(false); }
  };

  const save = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_hours: parseFloat(form.duration_hours),
        modules: modules.filter((m) => m.title),
        quiz,
        competency_map: maps.filter((m) => m.competency_id).map((m) => ({
          competency_id: m.competency_id,
          from_level: parseInt(m.from_level),
          to_level: parseInt(m.to_level),
        })),
      };
      const { data } = await api.post("/courses", payload);
      toast.success("Course published");
      nav(`/course/${data.id}`);
    } catch (e) { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Trainer Studio</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">Create Course</h1>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="course-title" />
            </div>
            <div>
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (hours)</Label>
              <Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} data-testid="course-desc" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-display font-bold text-[#0B192C]">Modules</h3>
            <Button size="sm" variant="outline" onClick={() => setModules([...modules, { title: "", type: "video", content: "" }])}><Plus size={14} className="mr-1" /> Add</Button>
          </div>
          <div className="space-y-3">
            {modules.map((m, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr,120px,2fr,40px] gap-2 items-start">
                <Input placeholder="Title" value={m.title} onChange={(e) => { const n = [...modules]; n[i].title = e.target.value; setModules(n); }} />
                <Select value={m.type} onValueChange={(v) => { const n = [...modules]; n[i].type = v; setModules(n); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="video">Video</SelectItem><SelectItem value="pdf">PDF</SelectItem></SelectContent>
                </Select>
                <Input placeholder="Content" value={m.content} onChange={(e) => { const n = [...modules]; n[i].content = e.target.value; setModules(n); }} />
                <Button size="icon" variant="ghost" onClick={() => setModules(modules.filter((_, x) => x !== i))}><Trash2 size={14} /></Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-bold text-[#0B192C] mb-3">Competency Mapping</h3>
          <div className="space-y-2">
            {maps.map((m, i) => (
              <div key={i} className="grid sm:grid-cols-[2fr,80px,80px,40px] gap-2">
                <Select value={m.competency_id} onValueChange={(v) => { const n = [...maps]; n[i].competency_id = v; setMaps(n); }}>
                  <SelectTrigger><SelectValue placeholder="Competency" /></SelectTrigger>
                  <SelectContent>{competencies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" min="0" max="4" placeholder="From" value={m.from_level} onChange={(e) => { const n = [...maps]; n[i].from_level = e.target.value; setMaps(n); }} />
                <Input type="number" min="0" max="4" placeholder="To" value={m.to_level} onChange={(e) => { const n = [...maps]; n[i].to_level = e.target.value; setMaps(n); }} />
                <Button size="icon" variant="ghost" onClick={() => setMaps(maps.filter((_, x) => x !== i))}><Trash2 size={14} /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setMaps([...maps, { competency_id: "", from_level: 0, to_level: 1 }])}><Plus size={14} className="mr-1" /> Add mapping</Button>
          </div>
        </Card>

        <Card className="p-6 border-2 border-[#D4AF37]/40 bg-gradient-to-br from-amber-50/40 to-white">
          <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm mb-1"><Sparkles size={16} /> AI Quiz Generator</div>
          <div className="text-xs text-slate-500 mb-3">Auto-generate MCQs with Claude Sonnet 4.6</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Topic (e.g. Ocean Modelling)" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} data-testid="ai-topic" />
            <Button onClick={generateQuiz} disabled={gen} className="bg-[#0B192C]" data-testid="ai-gen-btn">
              {gen ? <><Loader2 size={14} className="animate-spin mr-2" /> Generating...</> : "Generate 5 questions"}
            </Button>
          </div>
          <Textarea className="mt-3" placeholder="Optional reference content" value={aiContent} onChange={(e) => setAiContent(e.target.value)} rows={3} />
          {quiz.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Quiz Preview ({quiz.length})</div>
              {quiz.map((q, i) => (
                <div key={i} className="p-3 bg-white border rounded-md text-sm">
                  <div className="font-semibold">Q{i+1}. {q.q}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    {q.options?.map((o, j) => <span key={j} className={`mr-3 ${j === q.correct ? "text-emerald-700 font-semibold" : ""}`}>{String.fromCharCode(65+j)}. {o}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Button onClick={save} disabled={saving} size="lg" className="bg-[#0B192C] hover:bg-[#1E3E62]" data-testid="save-course-btn">
          {saving ? "Publishing..." : "Publish Course"}
        </Button>
      </div>
    </Layout>
  );
}
