"""
CAPACITY CONNECT - MoES Workforce Capability Management System
Backend: FastAPI + MongoDB
"""
import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
import bcrypt
import jwt as pyjwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="CAPACITY CONNECT API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("capacity-connect")


# ---------------- Utilities ----------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_id() -> str:
    return str(uuid.uuid4())


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def require_role(*roles: str):
    async def _check(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, "Insufficient permissions")
        return user
    return _check


# ---------------- Models ----------------
class SignupReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "employee"
    department: Optional[str] = None
    designation: Optional[str] = None


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class CourseCreate(BaseModel):
    title: str
    description: str
    duration_hours: float = 4
    level: str = "Intermediate"
    thumbnail: Optional[str] = None
    modules: List[Dict[str, Any]] = []
    competency_map: List[Dict[str, Any]] = []  # [{competency_id, from_level, to_level}]
    quiz: List[Dict[str, Any]] = []  # [{q, options, correct}]


class EnrollReq(BaseModel):
    employee_id: str
    course_id: str


class ProgressReq(BaseModel):
    course_id: str
    module_index: int
    progress: float


class QuizSubmit(BaseModel):
    course_id: str
    answers: List[int]


class AssignReq(BaseModel):
    employee_ids: List[str]
    course_id: str


# ---------------- AUTH ----------------
@api.post("/auth/signup")
async def signup(req: SignupReq):
    exists = await db.users.find_one({"email": req.email})
    if exists:
        raise HTTPException(400, "Email already registered")
    user = {
        "id": gen_id(),
        "name": req.name,
        "email": req.email,
        "password": hash_password(req.password),
        "role": req.role,
        "department": req.department,
        "designation": req.designation,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], user["role"])
    user.pop("password", None)
    user.pop("_id", None)
    return {"token": token, "user": user}


@api.post("/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"], user["role"])
    user.pop("password", None)
    user.pop("_id", None)
    return {"token": token, "user": user}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------------- DEPARTMENTS ----------------
@api.get("/departments")
async def list_departments():
    return await db.departments.find({}, {"_id": 0}).to_list(1000)


# ---------------- COMPETENCIES ----------------
@api.get("/competencies")
async def list_competencies():
    return await db.competencies.find({}, {"_id": 0}).to_list(1000)


# ---------------- COURSES ----------------
@api.get("/courses")
async def list_courses():
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    return courses


@api.get("/courses/{course_id}")
async def get_course(course_id: str):
    c = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Course not found")
    return c


@api.post("/courses")
async def create_course(req: CourseCreate, user=Depends(require_role("admin", "trainer"))):
    course = {
        "id": gen_id(),
        "title": req.title,
        "description": req.description,
        "duration_hours": req.duration_hours,
        "level": req.level,
        "thumbnail": req.thumbnail or "https://images.unsplash.com/photo-1708738793054-32b71e3fc822?w=800",
        "modules": req.modules,
        "competency_map": req.competency_map,
        "quiz": req.quiz,
        "trainer_id": user["id"],
        "trainer_name": user["name"],
        "created_at": now_iso(),
    }
    await db.courses.insert_one(course)
    course.pop("_id", None)
    return course


# ---------------- ENROLLMENTS ----------------
@api.get("/enrollments/me")
async def my_enrollments(user=Depends(get_current_user)):
    enrolls = await db.enrollments.find({"employee_id": user["id"]}, {"_id": 0}).to_list(1000)
    # attach course info
    for e in enrolls:
        c = await db.courses.find_one({"id": e["course_id"]}, {"_id": 0})
        e["course"] = c
    return enrolls


@api.post("/enrollments/assign")
async def assign_course(req: AssignReq, user=Depends(require_role("admin"))):
    created = []
    for emp_id in req.employee_ids:
        existing = await db.enrollments.find_one({"employee_id": emp_id, "course_id": req.course_id})
        if existing:
            continue
        enroll = {
            "id": gen_id(),
            "employee_id": emp_id,
            "course_id": req.course_id,
            "status": "assigned",
            "progress": 0,
            "module_progress": {},
            "quiz_score": None,
            "assigned_by": user["id"],
            "assigned_at": now_iso(),
            "completed_at": None,
        }
        await db.enrollments.insert_one(enroll)
        # notification
        await db.notifications.insert_one({
            "id": gen_id(),
            "employee_id": emp_id,
            "message": f"New training assigned to you. Please complete before the deadline.",
            "type": "assignment",
            "read": False,
            "created_at": now_iso(),
        })
        enroll.pop("_id", None)
        created.append(enroll)
    return {"created": len(created), "enrollments": created}


@api.post("/enrollments/self")
async def self_enroll(body: Dict[str, str], user=Depends(get_current_user)):
    course_id = body.get("course_id")
    existing = await db.enrollments.find_one({"employee_id": user["id"], "course_id": course_id})
    if existing:
        return {"status": "already_enrolled"}
    enroll = {
        "id": gen_id(),
        "employee_id": user["id"],
        "course_id": course_id,
        "status": "in_progress",
        "progress": 0,
        "module_progress": {},
        "quiz_score": None,
        "assigned_at": now_iso(),
        "completed_at": None,
    }
    await db.enrollments.insert_one(enroll)
    return {"status": "enrolled"}


@api.post("/enrollments/progress")
async def update_progress(req: ProgressReq, user=Depends(get_current_user)):
    enroll = await db.enrollments.find_one({"employee_id": user["id"], "course_id": req.course_id})
    if not enroll:
        raise HTTPException(404, "Not enrolled")
    course = await db.courses.find_one({"id": req.course_id})
    mod_prog = enroll.get("module_progress", {})
    mod_prog[str(req.module_index)] = req.progress
    total_mods = max(len(course.get("modules", [])), 1)
    overall = sum(mod_prog.values()) / total_mods
    status_val = "in_progress" if overall < 100 else "content_complete"
    await db.enrollments.update_one(
        {"id": enroll["id"]},
        {"$set": {"module_progress": mod_prog, "progress": overall, "status": status_val}}
    )
    return {"progress": overall, "status": status_val}


@api.post("/enrollments/quiz")
async def submit_quiz(req: QuizSubmit, user=Depends(get_current_user)):
    enroll = await db.enrollments.find_one({"employee_id": user["id"], "course_id": req.course_id})
    if not enroll:
        raise HTTPException(404, "Not enrolled")
    course = await db.courses.find_one({"id": req.course_id})
    quiz = course.get("quiz", [])
    if not quiz:
        raise HTTPException(400, "No quiz for this course")
    correct = 0
    for i, q in enumerate(quiz):
        if i < len(req.answers) and req.answers[i] == q.get("correct"):
            correct += 1
    score = round(100 * correct / len(quiz))
    passed = score >= 60

    updates = {"quiz_score": score, "status": "completed" if passed else "quiz_failed"}
    cert_id = None
    if passed:
        updates["completed_at"] = now_iso()
        updates["progress"] = 100
        # Certificate
        cert_id = f"MOES-{gen_id()[:8].upper()}"
        cert = {
            "id": gen_id(),
            "certificate_id": cert_id,
            "employee_id": user["id"],
            "employee_name": user["name"],
            "course_id": req.course_id,
            "course_title": course["title"],
            "score": score,
            "issued_at": now_iso(),
        }
        await db.certificates.insert_one(cert)
        # Update competencies
        for cmap in course.get("competency_map", []):
            comp_id = cmap["competency_id"]
            target = cmap["to_level"]
            existing = await db.employee_competencies.find_one({"employee_id": user["id"], "competency_id": comp_id})
            if existing:
                if existing["current_level"] < target:
                    await db.employee_competencies.update_one(
                        {"id": existing["id"]},
                        {"$set": {"current_level": target, "updated_at": now_iso()}}
                    )
            else:
                await db.employee_competencies.insert_one({
                    "id": gen_id(),
                    "employee_id": user["id"],
                    "competency_id": comp_id,
                    "current_level": target,
                    "required_level": target,
                    "updated_at": now_iso(),
                })
        await db.notifications.insert_one({
            "id": gen_id(),
            "employee_id": user["id"],
            "message": f"Congratulations! You completed {course['title']} and earned a certificate.",
            "type": "achievement",
            "read": False,
            "created_at": now_iso(),
        })
    await db.enrollments.update_one({"id": enroll["id"]}, {"$set": updates})
    return {"score": score, "passed": passed, "certificate_id": cert_id}


# ---------------- COMPETENCIES / GAPS ----------------
@api.get("/competencies/profile/{employee_id}")
async def competency_profile(employee_id: str):
    emp = await db.users.find_one({"id": employee_id}, {"_id": 0, "password": 0})
    if not emp:
        raise HTTPException(404, "Employee not found")
    comps = await db.competencies.find({}, {"_id": 0}).to_list(1000)
    emp_comps = await db.employee_competencies.find({"employee_id": employee_id}, {"_id": 0}).to_list(1000)
    emp_map = {c["competency_id"]: c for c in emp_comps}
    profile = []
    for c in comps:
        ec = emp_map.get(c["id"], {})
        current = ec.get("current_level", 0)
        required = ec.get("required_level", 0)
        gap = max(0, required - current)
        if gap == 0:
            status_val = "meets"
        elif gap == 1:
            status_val = "small_gap"
        else:
            status_val = "major_gap"
        profile.append({
            "competency": c,
            "current_level": current,
            "required_level": required,
            "gap": gap,
            "status": status_val,
        })
    return {"employee": emp, "profile": profile}


@api.get("/competencies/me")
async def my_competency(user=Depends(get_current_user)):
    return await competency_profile(user["id"])


@api.get("/analytics/gap-dashboard")
async def gap_dashboard(department: Optional[str] = None):
    users_q = {"role": "employee"}
    if department:
        users_q["department"] = department
    employees = await db.users.find(users_q, {"_id": 0, "password": 0}).to_list(10000)
    comps = await db.competencies.find({}, {"_id": 0}).to_list(1000)
    emp_ids = [e["id"] for e in employees]
    emp_comps = await db.employee_competencies.find({"employee_id": {"$in": emp_ids}}, {"_id": 0}).to_list(10000)

    # Aggregate gap per competency
    gap_by_comp: Dict[str, Dict[str, Any]] = {}
    for c in comps:
        gap_by_comp[c["id"]] = {"competency": c, "total_gap": 0, "affected": 0, "avg_current": 0, "count": 0}

    for emp in employees:
        for c in comps:
            ec = next((x for x in emp_comps if x["employee_id"] == emp["id"] and x["competency_id"] == c["id"]), None)
            if not ec:
                continue
            current = ec.get("current_level", 0)
            required = ec.get("required_level", 0)
            gap = max(0, required - current)
            gap_by_comp[c["id"]]["count"] += 1
            gap_by_comp[c["id"]]["avg_current"] += current
            if gap > 0:
                gap_by_comp[c["id"]]["total_gap"] += gap
                gap_by_comp[c["id"]]["affected"] += 1

    total_emps = max(len(employees), 1)
    results = []
    for cid, data in gap_by_comp.items():
        pct = round(100 * data["affected"] / total_emps)
        priority = "LOW"
        if pct >= 30:
            priority = "HIGH"
        elif pct >= 15:
            priority = "MED"
        avg_curr = round(data["avg_current"] / max(data["count"], 1), 1)
        results.append({
            "competency": data["competency"],
            "affected_pct": pct,
            "affected_count": data["affected"],
            "avg_current_level": avg_curr,
            "priority": priority,
        })
    results.sort(key=lambda x: -x["affected_pct"])
    return {"total_employees": len(employees), "gaps": results}


@api.get("/analytics/admin-overview")
async def admin_overview(user=Depends(require_role("admin"))):
    total_emps = await db.users.count_documents({"role": "employee"})
    total_courses = await db.courses.count_documents({})
    total_enrolls = await db.enrollments.count_documents({})
    completed = await db.enrollments.count_documents({"status": "completed"})
    in_progress = await db.enrollments.count_documents({"status": {"$in": ["in_progress", "content_complete", "assigned"]}})
    total_certs = await db.certificates.count_documents({})
    active = await db.enrollments.distinct("employee_id", {"status": {"$in": ["in_progress", "content_complete"]}})
    completion_rate = round(100 * completed / max(total_enrolls, 1))

    # Department competency avg
    departments = await db.departments.find({}, {"_id": 0}).to_list(100)
    dept_scores = []
    for d in departments:
        emps = await db.users.find({"role": "employee", "department": d["name"]}, {"_id": 0}).to_list(1000)
        if not emps:
            dept_scores.append({"department": d["name"], "score": 0})
            continue
        emp_ids = [e["id"] for e in emps]
        ecs = await db.employee_competencies.find({"employee_id": {"$in": emp_ids}}, {"_id": 0}).to_list(10000)
        if not ecs:
            dept_scores.append({"department": d["name"], "score": 0})
            continue
        scores = []
        for ec in ecs:
            if ec.get("required_level", 0) > 0:
                scores.append(min(100, round(100 * ec["current_level"] / ec["required_level"])))
        avg = round(sum(scores) / max(len(scores), 1)) if scores else 0
        dept_scores.append({"department": d["name"], "score": avg})

    return {
        "total_employees": total_emps,
        "active_learners": len(active),
        "total_courses": total_courses,
        "completion_rate": completion_rate,
        "certificates": total_certs,
        "in_progress": in_progress,
        "completed": completed,
        "department_scores": dept_scores,
    }


# ---------------- USERS (admin) ----------------
@api.get("/users")
async def list_users(role: Optional[str] = None, user=Depends(require_role("admin", "trainer"))):
    q = {}
    if role:
        q["role"] = role
    users = await db.users.find(q, {"_id": 0, "password": 0}).to_list(1000)
    return users


# ---------------- CERTIFICATES ----------------
@api.get("/certificates/me")
async def my_certs(user=Depends(get_current_user)):
    certs = await db.certificates.find({"employee_id": user["id"]}, {"_id": 0}).to_list(1000)
    return certs


@api.get("/certificates/verify/{certificate_id}")
async def verify_cert(certificate_id: str):
    cert = await db.certificates.find_one({"certificate_id": certificate_id}, {"_id": 0})
    if not cert:
        return {"valid": False}
    return {"valid": True, "certificate": cert}


# ---------------- NOTIFICATIONS ----------------
@api.get("/notifications/me")
async def my_notifs(user=Depends(get_current_user)):
    n = await db.notifications.find({"employee_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return n


@api.post("/notifications/{nid}/read")
async def mark_read(nid: str, user=Depends(get_current_user)):
    await db.notifications.update_one({"id": nid, "employee_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ---------------- AI RECOMMENDATIONS ----------------
def rule_based_recommendations(profile: List[Dict], courses: List[Dict]) -> List[Dict]:
    """Suggest courses that reduce the biggest competency gaps."""
    gaps = [p for p in profile if p["gap"] > 0]
    gaps.sort(key=lambda x: -x["gap"])
    recs = []
    seen = set()
    for g in gaps:
        cid = g["competency"]["id"]
        for c in courses:
            for cm in c.get("competency_map", []):
                if cm["competency_id"] == cid and cm["to_level"] >= g["current_level"] + 1:
                    if c["id"] not in seen:
                        recs.append({
                            "course": c,
                            "reason": f"Closes {g['competency']['name']} gap (Level {g['current_level']} → {cm['to_level']})",
                            "priority": "HIGH" if g["gap"] >= 2 else "MED",
                            "gap_reduced": g["gap"],
                        })
                        seen.add(c["id"])
                        break
    return recs[:6]


@api.get("/recommendations/me")
async def my_recommendations(user=Depends(get_current_user)):
    prof_data = await competency_profile(user["id"])
    profile = prof_data["profile"]
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    recs = rule_based_recommendations(profile, courses)
    return {"recommendations": recs}


@api.post("/ai/learning-path")
async def ai_learning_path(body: Dict[str, Any], user=Depends(get_current_user)):
    """Generate personalized learning-path suggestion using Claude Sonnet 4.6."""
    goal = body.get("goal", "Grow overall capability")
    prof_data = await competency_profile(user["id"])
    gaps_text = "\n".join([
        f"- {p['competency']['name']}: current L{p['current_level']}, required L{p['required_level']}, gap {p['gap']}"
        for p in prof_data["profile"]
    ])
    courses = await db.courses.find({}, {"_id": 0, "modules": 0, "quiz": 0}).to_list(1000)
    course_list = "\n".join([f"- {c['title']} ({c['level']}, {c['duration_hours']}h)" for c in courses])

    prompt = (
        f"Employee: {user['name']}, Department: {user.get('department', 'N/A')}\n"
        f"Goal: {goal}\n\nCompetency profile:\n{gaps_text}\n\nAvailable courses:\n{course_list}\n\n"
        "Suggest a step-by-step learning pathway (max 6 steps). "
        "For each step, give: step number, course title (pick from above), why it helps. "
        "Be concise. Format as plain text with numbered steps."
    )

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"lp-{user['id']}",
            system_message="You are a workforce learning strategist for the Ministry of Earth Sciences.",
        ).with_model("anthropic", "claude-sonnet-4-6")
        resp = await chat.send_message(UserMessage(text=prompt))
        return {"learning_path": resp, "goal": goal}
    except Exception as e:
        logger.error(f"AI error: {e}")
        # Fallback to rule-based
        recs = rule_based_recommendations(prof_data["profile"], await db.courses.find({}, {"_id": 0}).to_list(1000))
        fallback = "\n".join([f"{i+1}. {r['course']['title']} — {r['reason']}" for i, r in enumerate(recs)])
        return {"learning_path": fallback or "No recommendations available.", "goal": goal, "fallback": True}


@api.post("/ai/generate-quiz")
async def ai_generate_quiz(body: Dict[str, Any], user=Depends(require_role("admin", "trainer"))):
    """Generate MCQ quiz from topic/content using Claude Sonnet 4.6."""
    topic = body.get("topic", "")
    content = body.get("content", "")
    n = body.get("n", 5)
    prompt = (
        f"Generate {n} MCQ questions on: {topic}\n"
        f"Reference content: {content[:2000]}\n\n"
        "Return valid JSON only, no markdown. Format:\n"
        '[{"q":"question","options":["a","b","c","d"],"correct":0}]\n'
        "correct is 0-indexed. Mix difficulty."
    )
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"quiz-{gen_id()}",
            system_message="You generate MCQ quizzes. Return only valid JSON arrays, no prose.",
        ).with_model("anthropic", "claude-sonnet-4-6")
        resp = await chat.send_message(UserMessage(text=prompt))
        import json, re
        # extract JSON
        m = re.search(r"\[.*\]", resp, re.DOTALL)
        if m:
            data = json.loads(m.group(0))
            return {"quiz": data}
        return {"quiz": [], "raw": resp}
    except Exception as e:
        logger.error(f"AI quiz error: {e}")
        return {"quiz": [], "error": str(e)}


# ---------------- SEED ----------------
@api.post("/seed")
async def seed_data():
    """Idempotent seed for MoES demo data."""
    # Departments
    departments = [
        {"id": "dep-ocean", "name": "Ocean Science"},
        {"id": "dep-meteo", "name": "Meteorology"},
        {"id": "dep-it", "name": "IT"},
        {"id": "dep-climate", "name": "Climate Research"},
        {"id": "dep-admin", "name": "Administration"},
    ]
    for d in departments:
        await db.departments.update_one({"id": d["id"]}, {"$set": d}, upsert=True)

    # Competencies
    competencies = [
        {"id": "c-python", "name": "Python", "type": "technical", "description": "Programming for data analysis"},
        {"id": "c-data", "name": "Data Analytics", "type": "technical", "description": "Statistical data analysis"},
        {"id": "c-aiml", "name": "AI/ML", "type": "technical", "description": "Machine learning models"},
        {"id": "c-gis", "name": "GIS", "type": "technical", "description": "Geographic Information Systems"},
        {"id": "c-ocean", "name": "Ocean Modelling", "type": "technical", "description": "Ocean simulation and modelling"},
        {"id": "c-climate", "name": "Climate Modelling", "type": "technical", "description": "Climate change modelling"},
        {"id": "c-cyber", "name": "Cybersecurity", "type": "technical", "description": "IT security"},
        {"id": "c-lead", "name": "Leadership", "type": "professional", "description": "Team leadership"},
        {"id": "c-comm", "name": "Communication", "type": "professional", "description": "Professional communication"},
        {"id": "c-pm", "name": "Project Management", "type": "professional", "description": "Managing projects"},
    ]
    for c in competencies:
        await db.competencies.update_one({"id": c["id"]}, {"$set": c}, upsert=True)

    # Users
    demo_pw = hash_password("moes2026")
    users = [
        {"id": "u-admin", "name": "Dr. Anjali Verma", "email": "admin@moes.gov.in", "password": demo_pw, "role": "admin", "department": "Administration", "designation": "Chief Administrator"},
        {"id": "u-trainer", "name": "Prof. Vikram Rao", "email": "trainer@moes.gov.in", "password": demo_pw, "role": "trainer", "department": "IT", "designation": "Senior Trainer"},
        {"id": "u-emp1", "name": "Rahul Sharma", "email": "rahul@moes.gov.in", "password": demo_pw, "role": "employee", "department": "Ocean Science", "designation": "Scientist B"},
        {"id": "u-emp2", "name": "Priya Nair", "email": "priya@moes.gov.in", "password": demo_pw, "role": "employee", "department": "Meteorology", "designation": "Scientist C"},
        {"id": "u-emp3", "name": "Arjun Iyer", "email": "arjun@moes.gov.in", "password": demo_pw, "role": "employee", "department": "IT", "designation": "System Analyst"},
        {"id": "u-emp4", "name": "Kavita Menon", "email": "kavita@moes.gov.in", "password": demo_pw, "role": "employee", "department": "Ocean Science", "designation": "Research Fellow"},
        {"id": "u-emp5", "name": "Sanjay Bhat", "email": "sanjay@moes.gov.in", "password": demo_pw, "role": "employee", "department": "Climate Research", "designation": "Scientist B"},
    ]
    for u in users:
        u["created_at"] = now_iso()
        await db.users.update_one({"id": u["id"]}, {"$set": u}, upsert=True)

    # Courses
    ocean_thumb = "https://images.unsplash.com/photo-1743660236233-9ce45485dca7?w=800"
    space_thumb = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800"
    hero_thumb = "https://images.unsplash.com/photo-1708738793054-32b71e3fc822?w=800"

    courses = [
        {
            "id": "co-py-basics", "title": "Python for Data Analysis",
            "description": "Learn Python fundamentals for scientific data analysis with NumPy and Pandas.",
            "duration_hours": 6, "level": "Beginner", "thumbnail": space_thumb,
            "trainer_id": "u-trainer", "trainer_name": "Prof. Vikram Rao",
            "modules": [
                {"title": "Python Basics", "type": "video", "content": "Introduction to Python syntax."},
                {"title": "NumPy Essentials", "type": "video", "content": "Arrays and vectorization."},
                {"title": "Pandas DataFrames", "type": "video", "content": "Data manipulation with pandas."},
                {"title": "Data Visualization", "type": "pdf", "content": "Matplotlib and seaborn guide."},
            ],
            "competency_map": [
                {"competency_id": "c-python", "from_level": 0, "to_level": 2},
                {"competency_id": "c-data", "from_level": 0, "to_level": 1},
            ],
            "quiz": [
                {"q": "Which library is commonly used for tabular data in Python?", "options": ["NumPy", "Pandas", "Flask", "Django"], "correct": 1},
                {"q": "NumPy arrays are…", "options": ["Dynamic lists", "Homogeneous typed arrays", "Dictionaries", "Strings"], "correct": 1},
                {"q": "Which function reads a CSV in pandas?", "options": ["read_csv", "load_csv", "open_csv", "csv_read"], "correct": 0},
                {"q": "matplotlib.pyplot is imported typically as?", "options": ["plt", "mp", "pl", "pyp"], "correct": 0},
                {"q": "Vectorization improves…", "options": ["Readability only", "Performance", "Security", "Type safety"], "correct": 1},
            ],
        },
        {
            "id": "co-adv-py", "title": "Advanced Python & Machine Learning",
            "description": "Master advanced Python patterns and applied machine learning.",
            "duration_hours": 10, "level": "Advanced", "thumbnail": hero_thumb,
            "trainer_id": "u-trainer", "trainer_name": "Prof. Vikram Rao",
            "modules": [
                {"title": "Advanced Python", "type": "video", "content": "Decorators, generators, async."},
                {"title": "Scikit-learn", "type": "video", "content": "Classical ML models."},
                {"title": "Model Evaluation", "type": "pdf", "content": "Cross-validation and metrics."},
            ],
            "competency_map": [
                {"competency_id": "c-python", "from_level": 2, "to_level": 3},
                {"competency_id": "c-aiml", "from_level": 0, "to_level": 2},
            ],
            "quiz": [
                {"q": "Which is used for classification?", "options": ["KMeans", "LogisticRegression", "PCA", "TSNE"], "correct": 1},
                {"q": "Overfitting means…", "options": ["Underperforming on train", "Fitting noise in train", "Under-utilized memory", "Slow training"], "correct": 1},
                {"q": "Cross-validation helps to…", "options": ["Reduce compute", "Estimate generalization", "Increase params", "Encrypt data"], "correct": 1},
                {"q": "Precision measures…", "options": ["TP/(TP+FP)", "TP/(TP+FN)", "TN/(TN+FN)", "FP/N"], "correct": 0},
            ],
        },
        {
            "id": "co-ocean-mod", "title": "Advanced Ocean Modelling",
            "description": "Numerical modelling techniques for ocean circulation and Indian Ocean dynamics.",
            "duration_hours": 12, "level": "Advanced", "thumbnail": ocean_thumb,
            "trainer_id": "u-trainer", "trainer_name": "Prof. Vikram Rao",
            "modules": [
                {"title": "Ocean Dynamics", "type": "video", "content": "Physical oceanography basics."},
                {"title": "Numerical Methods", "type": "video", "content": "Grid-based simulations."},
                {"title": "ROMS & MOM Models", "type": "pdf", "content": "Regional ocean modelling systems."},
                {"title": "Case Study: Indian Ocean", "type": "video", "content": "Applied case study."},
            ],
            "competency_map": [
                {"competency_id": "c-ocean", "from_level": 1, "to_level": 4},
            ],
            "quiz": [
                {"q": "ROMS stands for?", "options": ["Regional Ocean Modelling System", "Realtime Ocean Model Sim", "Remote Ocean Metric Study", "Regional Oceanic Motion Sim"], "correct": 0},
                {"q": "The Coriolis effect depends on…", "options": ["Longitude", "Latitude", "Depth", "Salinity"], "correct": 1},
                {"q": "Thermohaline circulation is driven by…", "options": ["Temperature & Salinity", "Wind only", "Tides only", "Moon"], "correct": 0},
                {"q": "Bathymetry means…", "options": ["Ocean depth mapping", "Water salinity", "Air pressure", "Wave height"], "correct": 0},
            ],
        },
        {
            "id": "co-climate", "title": "Climate Modelling Fundamentals",
            "description": "Introduction to climate models, CMIP data, and Indian monsoon dynamics.",
            "duration_hours": 8, "level": "Intermediate", "thumbnail": space_thumb,
            "trainer_id": "u-trainer", "trainer_name": "Prof. Vikram Rao",
            "modules": [
                {"title": "Climate System Overview", "type": "video", "content": "Overview of Earth's climate."},
                {"title": "GCM & RCM", "type": "video", "content": "Global vs regional models."},
                {"title": "CMIP Data", "type": "pdf", "content": "Working with CMIP datasets."},
            ],
            "competency_map": [
                {"competency_id": "c-climate", "from_level": 0, "to_level": 2},
                {"competency_id": "c-data", "from_level": 1, "to_level": 2},
            ],
            "quiz": [
                {"q": "CMIP is a?", "options": ["Coupled Model Intercomparison Project", "Climate Metrics Impact Panel", "Compact Modelling Instrument", "Central Meteorology Institute"], "correct": 0},
                {"q": "GCM =", "options": ["Global Climate Model", "Grid Climate Meter", "Ground Compression Mode", "General Cloud Motion"], "correct": 0},
                {"q": "Monsoon is a…", "options": ["Seasonal wind system", "Ocean tide", "Solar cycle", "Volcanic event"], "correct": 0},
            ],
        },
        {
            "id": "co-cyber", "title": "Cybersecurity Awareness",
            "description": "Foundational cybersecurity for government IT workflows.",
            "duration_hours": 4, "level": "Beginner", "thumbnail": hero_thumb,
            "trainer_id": "u-trainer", "trainer_name": "Prof. Vikram Rao",
            "modules": [
                {"title": "Threat Landscape", "type": "video", "content": "Common threats."},
                {"title": "Password Hygiene", "type": "video", "content": "Strong password practices."},
                {"title": "Phishing", "type": "pdf", "content": "Recognizing phishing attacks."},
            ],
            "competency_map": [
                {"competency_id": "c-cyber", "from_level": 0, "to_level": 2},
            ],
            "quiz": [
                {"q": "Phishing typically arrives via…", "options": ["Email", "Radio", "Mail post", "Fax"], "correct": 0},
                {"q": "MFA stands for?", "options": ["Multi-Factor Authentication", "Multi-Format Access", "Main Firewall Admin", "Managed File Access"], "correct": 0},
                {"q": "Strong passwords should be…", "options": ["Short", "Long & complex", "Same across sites", "Written on desk"], "correct": 1},
            ],
        },
        {
            "id": "co-gis", "title": "GIS for Earth Sciences",
            "description": "Geographic Information Systems for spatial data analysis.",
            "duration_hours": 6, "level": "Intermediate", "thumbnail": ocean_thumb,
            "trainer_id": "u-trainer", "trainer_name": "Prof. Vikram Rao",
            "modules": [
                {"title": "GIS Basics", "type": "video", "content": "Introduction to GIS."},
                {"title": "QGIS Hands-on", "type": "video", "content": "Working with QGIS."},
                {"title": "Spatial Analysis", "type": "pdf", "content": "Spatial queries and joins."},
            ],
            "competency_map": [
                {"competency_id": "c-gis", "from_level": 1, "to_level": 3},
            ],
            "quiz": [
                {"q": "Shapefile stores…", "options": ["Vector data", "Raster only", "Text logs", "Audio"], "correct": 0},
                {"q": "CRS stands for?", "options": ["Coordinate Reference System", "Common Raster Set", "Central Region Standard", "Country Region Standard"], "correct": 0},
                {"q": "QGIS is…", "options": ["Proprietary", "Open source", "Cloud-only", "A game"], "correct": 1},
            ],
        },
    ]
    for c in courses:
        c["created_at"] = now_iso()
        await db.courses.update_one({"id": c["id"]}, {"$set": c}, upsert=True)

    # Employee competencies (current vs required)
    emp_comps = [
        # Rahul (Ocean Science)
        ("u-emp1", "c-python", 2, 3),
        ("u-emp1", "c-data", 2, 3),
        ("u-emp1", "c-ocean", 1, 4),
        ("u-emp1", "c-gis", 3, 3),
        ("u-emp1", "c-comm", 3, 3),
        # Priya (Meteorology)
        ("u-emp2", "c-python", 1, 3),
        ("u-emp2", "c-climate", 2, 4),
        ("u-emp2", "c-data", 2, 3),
        ("u-emp2", "c-comm", 3, 3),
        # Arjun (IT)
        ("u-emp3", "c-python", 3, 3),
        ("u-emp3", "c-cyber", 2, 4),
        ("u-emp3", "c-aiml", 1, 2),
        ("u-emp3", "c-comm", 2, 3),
        # Kavita (Ocean Science)
        ("u-emp4", "c-ocean", 1, 3),
        ("u-emp4", "c-data", 1, 3),
        ("u-emp4", "c-python", 0, 2),
        ("u-emp4", "c-gis", 2, 3),
        # Sanjay (Climate)
        ("u-emp5", "c-climate", 1, 4),
        ("u-emp5", "c-data", 2, 3),
        ("u-emp5", "c-python", 1, 3),
    ]
    for eid, cid, cur, req in emp_comps:
        await db.employee_competencies.update_one(
            {"employee_id": eid, "competency_id": cid},
            {"$set": {
                "id": f"{eid}-{cid}",
                "employee_id": eid,
                "competency_id": cid,
                "current_level": cur,
                "required_level": req,
                "updated_at": now_iso(),
            }},
            upsert=True,
        )

    # Sample enrollment for Rahul
    existing = await db.enrollments.find_one({"employee_id": "u-emp1", "course_id": "co-ocean-mod"})
    if not existing:
        await db.enrollments.insert_one({
            "id": gen_id(),
            "employee_id": "u-emp1",
            "course_id": "co-ocean-mod",
            "status": "assigned",
            "progress": 0,
            "module_progress": {},
            "quiz_score": None,
            "assigned_by": "u-admin",
            "assigned_at": now_iso(),
        })
        await db.notifications.insert_one({
            "id": gen_id(),
            "employee_id": "u-emp1",
            "message": "New training assigned: Advanced Ocean Modelling. Deadline in 14 days.",
            "type": "assignment",
            "read": False,
            "created_at": now_iso(),
        })

    return {"status": "seeded", "departments": len(departments), "competencies": len(competencies), "users": len(users), "courses": len(courses)}


# ---------------- Root ----------------
@api.get("/")
async def root():
    return {"service": "CAPACITY CONNECT API", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    # Auto-seed on startup if empty
    n = await db.users.count_documents({})
    if n == 0:
        try:
            await seed_data()
            logger.info("Auto-seeded demo data")
        except Exception as e:
            logger.error(f"Seed error: {e}")


@app.on_event("shutdown")
async def _shutdown():
    client.close()
