from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_auth_roster():
    res = client.get("/api/auth/roster")
    assert res.status_code == 200
    roster = res.json()
    assert len(roster) >= 3
    badges = [r["badgeNumber"] for r in roster]
    assert "BSF-9482-KR" in badges
    assert "ITBP-4108-AS" in badges
    assert "RAW-7721-RV" in badges


def test_auth_login_success():
    res = client.post(
        "/api/auth/login",
        json={
            "badge": "BSF-9482-KR",
            "password": "MAATRIX2026",
            "remember_me": True,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "token" in data
    assert data["operator"]["badgeNumber"] == "BSF-9482-KR"
    assert data["operator"]["role"] == "Shift Commander"

    # Verify session using token
    token = data["token"]
    verify_res = client.get(
        "/api/auth/session",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["valid"] is True
    assert verify_data["badge"] == "BSF-9482-KR"


def test_auth_login_invalid_password():
    res = client.post(
        "/api/auth/login",
        json={
            "badge": "BSF-9482-KR",
            "password": "WRONG_PASSWORD_XYZ",
        },
    )
    assert res.status_code == 401
    assert "Authentication failed" in res.json()["detail"]


def test_auth_login_unknown_badge():
    res = client.post(
        "/api/auth/login",
        json={
            "badge": "UNKNOWN-000",
            "password": "MAATRIX2026",
        },
    )
    assert res.status_code == 401
    assert "not recognized" in res.json()["detail"]


def test_auth_logout():
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["success"] is True


if __name__ == "__main__":
    test_auth_roster()
    test_auth_login_success()
    test_auth_login_invalid_password()
    test_auth_login_unknown_badge()
    test_auth_logout()
    print("ALL AUTH BACKEND TESTS PASSED SUCCESSFULLY!")

