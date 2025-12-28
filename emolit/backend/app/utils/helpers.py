from typing import Dict, Any, List
import re
from datetime import datetime


# ---------- Text & Formatting Utilities ----------

def clean_display_text(text: str) -> str:
    """
    Light normalization for display purposes only.
    Emotion analysis owns its own preprocessing.
    """
    text = re.sub(r"\s+", " ", text).strip()
    return text


def format_datetime(dt: datetime) -> str:
    """Format datetime consistently for UI display"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def time_ago(dt: datetime) -> str:
    """Human-readable relative time"""
    now = datetime.utcnow()
    diff = now - dt

    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
    if diff.seconds >= 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    if diff.seconds >= 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"

    return "Just now"


# ---------- Pure Math Utilities ----------

def calculate_emotion_intensity(emotions: List[Dict[str, Any]]) -> float:
    """
    Returns a normalized emotional intensity score (0–1).
    This is descriptive, not evaluative.
    """
    if not emotions:
        return 0.0

    total = sum(e.get("score", 0.0) for e in emotions)
    return min(total, 1.0)


# ---------- File Safety ----------

def sanitize_filename(filename: str) -> str:
    """Sanitize filenames for safe storage"""
    filename = re.sub(r'[<>:"/\\|?*]', "", filename)
    filename = filename.strip(". ")
    return filename[:255]
