"""Backend tests for Capacity Connect P0 fix: employee dashboard endpoint and role-based sign-in."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://skill-gap-analyzer-62.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
PASSWORD = "moes2026"


@pytest.fixture(scope="session", autouse=True)
def ensure_seed():
    # Idempotent seed
    try:
        requests.post(f"{API}/seed", timeout=30)
    except Exception:
        pass


def _login(email):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Auth / role routing ----
class TestAuth:
    def test_employee_login(self):
        d = _login("rahul@moes.gov.in")
        assert d["user"]["role"] == "employee"

    def test_admin_login(self):
        d = _login("admin@moes.gov.in")
        assert d["user"]["role"] == "admin"

    def test_trainer_login(self):
        d = _login("trainer@moes.gov.in")
        assert d["user"]["role"] == "trainer"


# ---- Employee dashboard endpoint (P0 fix) ----
class TestEmployeeDashboard:
    def test_returns_200_and_shape(self):
        token = _login("rahul@moes.gov.in")["token"]
        r = requests.get(f"{API}/analytics/employee-dashboard", headers=_headers(token), timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # Required top-level keys
        for k in ["stats", "enrollments", "certificates", "recommendations", "competency"]:
            assert k in data, f"missing {k}"
        stats = data["stats"]
        for k in ["assigned", "completed", "certificates", "average_progress", "competency_score"]:
            assert k in stats, f"missing stats.{k}"

    def test_stats_agree_with_enrollments(self):
        token = _login("rahul@moes.gov.in")["token"]
        r = requests.get(f"{API}/analytics/employee-dashboard", headers=_headers(token), timeout=30)
        data = r.json()
        enrollments = data["enrollments"]
        assert data["stats"]["assigned"] == len(enrollments)
        completed = sum(1 for e in enrollments if e.get("status") == "completed")
        assert data["stats"]["completed"] == completed
        assert data["stats"]["certificates"] == len(data["certificates"])

    def test_requires_employee_role(self):
        # Admin should NOT be able to access employee dashboard
        token = _login("admin@moes.gov.in")["token"]
        r = requests.get(f"{API}/analytics/employee-dashboard", headers=_headers(token), timeout=30)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"

    def test_unauthenticated_rejected(self):
        r = requests.get(f"{API}/analytics/employee-dashboard", timeout=30)
        assert r.status_code in (401, 403)


class TestOtherRoleDashboards:
    def test_admin_overview(self):
        token = _login("admin@moes.gov.in")["token"]
        r = requests.get(f"{API}/analytics/admin-overview", headers=_headers(token), timeout=30)
        assert r.status_code == 200
