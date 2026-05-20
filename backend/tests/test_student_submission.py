import os
import sys
from pathlib import Path


os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("DASHSCOPE_API_KEY", "test-dashscope-key")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.student import count_plain_text_chars  # noqa: E402


def test_count_plain_text_chars_ignores_html_tags_and_whitespace():
    assert count_plain_text_chars("<p>你 好</p><p>世界</p>") == 4


def test_count_plain_text_chars_handles_empty_content():
    assert count_plain_text_chars("") == 0
