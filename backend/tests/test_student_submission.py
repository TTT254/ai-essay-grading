import os
import sys
from io import BytesIO
from pathlib import Path


os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("DASHSCOPE_API_KEY", "test-dashscope-key")
os.environ.setdefault("ARK_API_KEY", "test-ark-key")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import HTTPException, UploadFile  # noqa: E402
from api.student import count_plain_text_chars, validate_image_upload  # noqa: E402


def test_count_plain_text_chars_ignores_html_tags_and_whitespace():
    assert count_plain_text_chars("<p>你 好</p><p>世界</p>") == 4


def test_count_plain_text_chars_handles_empty_content():
    assert count_plain_text_chars("") == 0


def test_validate_image_upload_accepts_supported_extensions():
    file = UploadFile(file=BytesIO(b"image"), filename="essay.PNG")

    assert validate_image_upload(file) == "png"


def test_validate_image_upload_rejects_unsupported_extensions():
    file = UploadFile(file=BytesIO(b"not-image"), filename="essay.pdf")

    try:
        validate_image_upload(file)
    except HTTPException as exc:
        assert exc.status_code == 400
        assert exc.detail == "不支持的文件格式"
    else:
        raise AssertionError("Expected HTTPException")
