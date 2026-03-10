"""Tests for teacher ranking API endpoints."""
import pytest
from app.models.results.model import Result


# ---------------------------------------------------------------------------
# Helper to create a teacher attached to a group
# ---------------------------------------------------------------------------
async def _setup_teacher_with_results(auth_client, async_db, test_kafedra, test_group, grades: list[int]):
    """Create a teacher, assign to group, and insert result rows."""
    # Create user for teacher
    user_resp = await auth_client.post(
        "/user/",
        json={"username": f"rank_teacher_{len(grades)}", "password": "pw123", "roles": [{"name": "Admin"}]},
    )
    assert user_resp.status_code == 201
    user_data = user_resp.json()

    # Create teacher
    teacher_resp = await auth_client.post(
        "/teacher/",
        json={
            "first_name": "Rank",
            "last_name": f"Teacher{len(grades)}",
            "third_name": "X",
            "kafedra_id": test_kafedra["id"],
            "user_id": user_data["id"],
        },
    )
    assert teacher_resp.status_code == 201
    teacher_data = teacher_resp.json()

    # Assign teacher to group
    assign_resp = await auth_client.post(
        "/teacher/assign_groups",
        json={"user_id": user_data["id"], "group_ids": [test_group["id"]]},
    )
    assert assign_resp.status_code == 200

    # Insert result rows directly into DB (no quiz process needed for ranking tests)
    student_count = len(grades)
    for i, grade in enumerate(grades):
        # Create a student user first
        s_resp = await auth_client.post(
            "/user/",
            json={
                "username": f"student_{len(grades)}_{i}",
                "password": "pw123",
                "roles": [{"name": "Admin"}],
            },
        )
        assert s_resp.status_code == 201
        student_id = s_resp.json()["id"]

        result = Result(
            user_id=student_id,
            group_id=test_group["id"],
            grade=grade,
            correct_answers=grade,
            wrong_answers=10 - grade,
        )
        async_db.add(result)

    await async_db.commit()
    return teacher_data


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_teacher_ranking_overall_empty(auth_client):
    """When no results exist the overall ranking returns an empty list."""
    resp = await auth_client.get("/teacher/ranking/overall")
    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "overall"
    assert data["total"] == 0
    assert data["teachers"] == []


@pytest.mark.asyncio
async def test_teacher_ranking_group(auth_client, async_db, test_kafedra, test_group):
    """A teacher assigned to a group should appear in the group ranking."""
    grades = [80, 90, 70]  # avg = 80
    teacher = await _setup_teacher_with_results(
        auth_client, async_db, test_kafedra, test_group, grades
    )

    resp = await auth_client.get(f"/teacher/ranking/group/{test_group['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "group"
    assert data["scope_id"] == test_group["id"]
    assert data["total"] >= 1

    first = data["teachers"][0]
    assert first["rank"] == 1
    assert first["teacher_id"] == teacher["id"]
    assert first["student_count"] == len(grades)
    # avg_grade should be close to 80
    assert abs(first["avg_grade"] - 80.0) < 0.01
    assert first["total_grade"] == sum(grades)


@pytest.mark.asyncio
async def test_teacher_ranking_kafedra(auth_client, async_db, test_kafedra, test_group):
    """Teacher should appear in kafedra ranking."""
    teacher = await _setup_teacher_with_results(
        auth_client, async_db, test_kafedra, test_group, [60, 70]
    )

    resp = await auth_client.get(f"/teacher/ranking/kafedra/{test_kafedra['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "kafedra"
    assert data["scope_id"] == test_kafedra["id"]
    assert data["total"] >= 1
    assert data["teachers"][0]["kafedra_id"] == test_kafedra["id"]


@pytest.mark.asyncio
async def test_teacher_ranking_faculty(auth_client, async_db, test_faculty, test_kafedra, test_group):
    """Teacher should appear in faculty ranking."""
    await _setup_teacher_with_results(
        auth_client, async_db, test_kafedra, test_group, [50, 60]
    )

    resp = await auth_client.get(f"/teacher/ranking/faculty/{test_faculty['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "faculty"
    assert data["scope_id"] == test_faculty["id"]
    assert data["total"] >= 1
    assert data["teachers"][0]["faculty_id"] == test_faculty["id"]


@pytest.mark.asyncio
async def test_teacher_ranking_ordering(auth_client, async_db, test_kafedra, test_group):
    """Teachers should be ordered by avg_grade descending."""
    # Teacher A: avg 90
    teacher_a = await _setup_teacher_with_results(
        auth_client, async_db, test_kafedra, test_group, [90, 90]
    )
    # Teacher B: avg 50
    # create second group for isolation isn't needed — same group, different teacher
    teacher_b = await _setup_teacher_with_results(
        auth_client, async_db, test_kafedra, test_group, [50, 50]
    )

    resp = await auth_client.get(f"/teacher/ranking/group/{test_group['id']}")
    assert resp.status_code == 200
    data = resp.json()
    teachers = data["teachers"]
    # The list must be sorted by avg_grade desc
    avgs = [t["avg_grade"] for t in teachers]
    assert avgs == sorted(avgs, reverse=True)
