import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, PlayCircle, FileText, Clock, User, Award } from "lucide-react";
import { toast } from "sonner";

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [course, setCourse] = useState(null);
  const [enroll, setEnroll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const load = async () => {
    const [c, e] = await Promise.all([
      api.get(`/courses/${id}`),
      api.get("/enrollments/me"),
    ]);
    setCourse(c.data);
    setEnroll(e.data.find((x) => x.course_id === id));
  };

  useEffect(() => { load(); }, [id]);

  const enrollSelf = async () => {
    await api.post("/enrollments/self", { course_id: id });
    toast.success("Enrolled");
    load();
  };

  const complete = async (idx) => {
    await api.post("/enrollments/progress", { course_id: id, module_index: idx, progress: 100 });
    toast.success("Module marked complete");
    load();
  };

  const submitQuiz = async () => {
    const ans = course.quiz.map((_, i) => answers[i] ?? -1);
    const { data } = await api.post("/enrollments/quiz", { course_id: id, answers: ans });
    setResult(data);
    if (data.passed) toast.success(`Passed with ${data.score}% — Certificate issued`);
    else toast.error(`Scored ${data.score}%. Need 60% to pass.`);
    load();
  };

  if (!course) return <Layout><div className="p-8 text-slate-500">Loading course...</div></Layout>;

  const modProg = enroll?.module_progress || {};
  const contentDone = enroll && (enroll.progress || 0) >= 100;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          <img src={course.thumbnail} alt="" className="w-full h-56 sm:h-72 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/90 to-[#0B192C]/20" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <Badge variant="outline" className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 mb-2">{course.level}</Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold">{course.title}</h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1"><Clock size={14} /> {course.duration_hours} hours</span>
              <span className="flex items-center gap-1"><User size={14} /> {course.trainer_name}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="modules">
              <TabsList data-testid="course-tabs">
                <TabsTrigger value="modules" data-testid="tab-modules">Modules</TabsTrigger>
                <TabsTrigger value="quiz" data-testid="tab-quiz">Assessment</TabsTrigger>
                <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="modules" className="space-y-3 mt-4">
                {!enroll && (
                  <Card className="p-5 flex items-center justify-between">
                    <div className="text-sm text-slate-600">You are not enrolled yet.</div>
                    <Button onClick={enrollSelf} className="bg-[#0B192C] hover:bg-[#1E3E62]" data-testid="enroll-btn">Enroll now</Button>
                  </Card>
                )}
                {course.modules.map((m, i) => {
                  const prog = modProg[String(i)] || 0;
                  const done = prog >= 100;
                  const Icon = m.type === "pdf" ? FileText : PlayCircle;
                  return (
                    <Card key={i} className="p-5" data-testid={`module-${i}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-[#0B192C]">Module {i+1}: {m.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">{m.type}</div>
                          <div className="text-sm text-slate-600 mt-2">{m.content}</div>
                          <div className="mt-3 flex items-center gap-3">
                            <Progress value={prog} className="flex-1" />
                            <span className="text-xs font-semibold w-10 text-right">{prog}%</span>
                            {enroll && !done && (
                              <Button size="sm" variant="outline" onClick={() => complete(i)} data-testid={`complete-${i}`}>Mark done</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="quiz" className="mt-4">
                <Card className="p-6">
                  {!enroll && <div className="text-slate-500 text-sm">Enroll to take the assessment.</div>}
                  {enroll && !contentDone && <div className="text-slate-500 text-sm">Complete all modules to unlock the assessment.</div>}
                  {enroll && contentDone && (
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#0B192C] mb-4">Final Assessment</h3>
                      <div className="space-y-5">
                        {course.quiz.map((q, i) => (
                          <div key={i} data-testid={`quiz-q-${i}`}>
                            <div className="font-semibold text-sm text-slate-800 mb-2">Q{i+1}. {q.q}</div>
                            <RadioGroup value={answers[i]?.toString() || ""} onValueChange={(v) => setAnswers({ ...answers, [i]: parseInt(v) })}>
                              {q.options.map((o, j) => (
                                <div key={j} className="flex items-center gap-2">
                                  <RadioGroupItem value={j.toString()} id={`q${i}-${j}`} data-testid={`quiz-${i}-opt-${j}`} />
                                  <Label htmlFor={`q${i}-${j}`} className="cursor-pointer">{o}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        ))}
                      </div>
                      <Button onClick={submitQuiz} className="mt-6 bg-[#0B192C] hover:bg-[#1E3E62]" data-testid="submit-quiz">Submit Assessment</Button>
                      {result && (
                        <div className={`mt-4 p-4 rounded-md ${result.passed ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                          <div className="font-bold">Score: {result.score}%</div>
                          <div className="text-sm mt-1">{result.passed ? "🏆 Passed! Certificate issued." : "Not passed. Try again."}</div>
                          {result.certificate_id && (
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => nav(`/certificate/${result.certificate_id}`)}>
                              <Award size={14} className="mr-1" /> View certificate
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="about" className="mt-4">
                <Card className="p-6">
                  <p className="text-slate-700 leading-relaxed">{course.description}</p>
                  {course.competency_map?.length > 0 && (
                    <div className="mt-5 pt-5 border-t">
                      <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Competencies advanced</div>
                      <div className="flex flex-wrap gap-2">
                        {course.competency_map.map((cm, i) => (
                          <Badge key={i} variant="outline" className="bg-[#008DDA]/10 text-[#0B192C] border-[#008DDA]/30">
                            L{cm.from_level} → L{cm.to_level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <Card className="p-5 h-fit sticky top-24">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Your progress</div>
            <div className="font-display font-extrabold text-3xl text-[#0B192C] mt-1">{Math.round(enroll?.progress || 0)}%</div>
            <Progress value={enroll?.progress || 0} className="mt-2" />
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Modules</span><span className="font-semibold">{course.modules.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Quiz Questions</span><span className="font-semibold">{course.quiz.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-semibold">{course.duration_hours}h</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Pass Score</span><span className="font-semibold">60%</span></div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
