import os
import sys
from pathlib import Path

import pytest


os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("DASHSCOPE_API_KEY", "test-dashscope-key")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api import auth  # noqa: E402


def expected_default_classes():
    return [
        {
            "grade": grade,
            "name": "1班",
            "student_count": 0,
        }
        for grade in range(1, 13)
    ]


@pytest.mark.asyncio
async def test_get_all_classes_returns_default_classes_for_all_grades_when_database_is_empty(monkeypatch):
    class FakeSupabaseService:
        async def get_all_classes(self):
            return []

        async def ensure_default_classes(self, existing_classes):
            assert existing_classes == []
            return expected_default_classes()

    monkeypatch.setattr(auth, "supabase_service", FakeSupabaseService())

    response = await auth.get_all_classes()

    assert response["success"] is True
    assert response["data"] == expected_default_classes()


@pytest.mark.asyncio
async def test_get_all_classes_fills_missing_grades_when_some_classes_exist(monkeypatch):
    existing_classes = [
        {
            "id": "grade-1-class",
            "grade": 1,
            "name": "1班",
            "student_count": 0,
        }
    ]

    class FakeSupabaseService:
        async def get_all_classes(self):
            return existing_classes

        async def ensure_default_classes(self, classes):
            assert classes == existing_classes
            return [
                *existing_classes,
                *[
                    {
                        "grade": grade,
                        "name": "1班",
                        "student_count": 0,
                    }
                    for grade in range(2, 13)
                ],
            ]

    monkeypatch.setattr(auth, "supabase_service", FakeSupabaseService())

    response = await auth.get_all_classes()

    assert response["success"] is True
    assert len(response["data"]) == 12
    assert {class_item["grade"] for class_item in response["data"]} == set(range(1, 13))
